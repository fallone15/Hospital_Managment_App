#!/usr/bin/env python3
"""
SYSTÈME RFID MIFARE DESFire EV1 - HOSPITAL
Version corrigée et stable pour VSCode
"""

import subprocess
import sys
import time

try:
    from smartcard.System import readers
    from smartcard.CardConnection import CardConnection
    from smartcard.util import toBytes, toHexString
    from smartcard.Exceptions import NoCardException
except ImportError:
    print("Installation de pyscard...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyscard"])
    from smartcard.System import readers
    from smartcard.CardConnection import CardConnection
    from smartcard.util import toBytes, toHexString
    from smartcard.Exceptions import NoCardException

class MifareDESFire:
    """Gestion MIFARE DESFire EV1"""

    # Commandes DESFire
    GET_VERSION = 0x60
    GET_UID = 0x51
    SELECT_APP = 0x5A
    CREATE_APP = 0xCA
    CREATE_FILE = 0xCF
    WRITE_DATA = 0x3D
    READ_DATA = 0x3C
    AUTHENTICATE = 0x0A

    # IDs
    MASTER_APP_ID = 0x000000
    PATIENT_APP_ID = 0x000001
    PATIENT_FILE_ID = 1

    def __init__(self):
        self.conn = None
        self.initialize()

    def initialize(self):
        """Initialiser le lecteur et la carte"""
        print("\n" + "="*70)
        print("SYSTÈME RFID MIFARE DESFire EV1 - HOSPITAL")
        print("="*70)

        print("\n📱 Recherche des lecteurs...")
        r = readers()

        if len(r) < 2:
            print("✓ Un seul lecteur trouvé")
            reader = r[0]
        else:
            # Prendre le lecteur Contactless
            reader = r[1]

        print(f"✓ Lecteur utilisé: {reader}")
        print("\n📱 Approchez une carte MIFARE DESFire EV1...")

        connected = False
        timeout = 30

        while timeout > 0 and not connected:
            try:
                self.conn = reader.createConnection()
                self.conn.connect()
                print("✓ Carte connectée!")
                connected = True
            except NoCardException:
                print(".", end="", flush=True)
                time.sleep(1)
                timeout -= 1
            except Exception as e:
                print(f"\n✗ Erreur connexion: {e}")
                time.sleep(1)
                timeout -= 1

        if not connected:
            print("\n✗ TIMEOUT: Aucune carte détectée!")
            sys.exit(1)

        # ATR
        try:
            atr = self.conn.getATR()
            atr_hex = ''.join([f'{b:02X}' for b in atr])
            print(f"ATR: {atr_hex}")
        except:
            pass

    def send_command(self, cmd_code, param=None):
        """Envoyer une commande DESFire"""
        try:
            cmd_list = [cmd_code]
            if param:
                if isinstance(param, list):
                    cmd_list += param
                elif isinstance(param, bytes):
                    cmd_list += list(param)
                elif isinstance(param, str):
                    cmd_list += [ord(c) for c in param]
            
            response, sw1, sw2 = self.conn.transmit(cmd_list, CardConnection.T0_protocol)
            
            if sw1 == 0x90 and sw2 == 0x00:
                return bytes(response)
            else:
                return None
        except Exception as e:
            print(f"Erreur commande: {e}")
            return None

    def select_desfire_app(self):
        """Sélectionner l'application DESFire"""
        try:
            # SELECT DF_MIFARE (D2760000850101)
            select_cmd = toBytes("00 A4 04 00 07 D2760000850101")
            response, sw1, sw2 = self.conn.transmit(select_cmd, CardConnection.T0_protocol)
            
            if sw1 == 0x90 and sw2 == 0x00:
                print("✓ Application DESFire sélectionnée")
                return True
            else:
                print(f"✗ SELECT échoué: {sw1:02X}{sw2:02X}")
                return False
        except Exception as e:
            print(f"✗ Erreur SELECT: {e}")
            return False
    
    def get_version(self):
        """Lire version"""
        print("\n" + "="*70)
        print("LIRE LA VERSION")
        print("="*70)
        
        if not self.select_desfire_app():
            return
        
        response = self.send_command(self.GET_VERSION)
        if response:
            version_hex = toHexString(response).replace(" ", "")
            print(f"✓ Version: {version_hex}")
        else:
            print("✗ Impossible de lire la version")

    def get_uid(self):
        """Lire UID - Plusieurs méthodes"""
        print("\n" + "="*70)
        print("LIRE L'UID")
        print("="*70)
        
        if not self.select_desfire_app():
            return
        
        # Méthode 1: Commande GET_UID (0x51)
        print("\nMéthode 1: Commande GET_UID...")
        response = self.send_command(0x51)
        if response and len(response) > 0:
            uid = toHexString(response).replace(" ", "")
            print(f"✓ UID (GET_UID): {uid}")
            return
        
        # Méthode 2: Lire depuis ATR
        print("Méthode 2: Lire depuis ATR...")
        try:
            atr = self.conn.getATR()
            atr_hex = ''.join([f'{b:02X}' for b in atr])
            print(f"ATR complet: {atr_hex}")
            
            # L'UID est généralement dans l'ATR
            if len(atr) >= 10:
                uid = atr_hex[6:20]  # Extraire les bytes de l'UID
                print(f"✓ UID (ATR): {uid}")
                return
        except Exception as e:
            print(f"Erreur ATR: {e}")
        
        # Méthode 3: Lire SELECT (teste la présence de la carte)
        print("Méthode 3: SELECT DF (Dedicated File)...")
        try:
            # SELECT Mifare DESFire
            select_cmd = toBytes("00 A4 04 00 07 D2760000850101")
            response, sw1, sw2 = self.conn.transmit(select_cmd, CardConnection.T0_protocol)
            
            if sw1 == 0x90 and sw2 == 0x00:
                print("✓ Carte DESFire détectée")
                # Relancer GET_UID
                response = self.send_command(0x51)
                if response:
                    uid = toHexString(response).replace(" ", "")
                    print(f"✓ UID: {uid}")
                else:
                    print("⚠️  Impossible de lire l'UID, mais carte détectée")
            else:
                print(f"✗ SELECT échoué: SW={sw1:02X}{sw2:02X}")
        except Exception as e:
            print(f"Erreur SELECT: {e}")

    def show_menu(self):
        """Menu principal"""
        while True:
            print("\n" + "="*70)
            print("MENU PRINCIPAL - DESFire EV1")
            print("="*70)
            print("1. 📖 Lire version")
            print("2. 📖 Lire UID")
            print("3. ❌ Quitter")
            print("="*70)

            choice = input("\nChoix (1-3): ").strip()

            if choice == "1":
                self.get_version()
            elif choice == "2":
                self.get_uid()
            elif choice == "3":
                print("✓ Au revoir!")
                break
            else:
                print("✗ Choix invalide!")

            input("\nAppuyez sur ENTER pour continuer...")

    def close(self):
        """Fermer la connexion"""
        try:
            if self.conn:
                self.conn.disconnect()
        except:
            pass

def main():
    desfire = None
    try:
        desfire = MifareDESFire()
        desfire.show_menu()
    except Exception as e:
        print(f"✗ Erreur: {e}")
    finally:
        if desfire:
            desfire.close()

if __name__ == "__main__":
    main()