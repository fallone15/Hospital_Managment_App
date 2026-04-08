# Diagramme UML / ER de la Base de Données

Voici le diagramme Entité-Relation basé sur le schéma de votre base de données (`initDatabase.js`). Ce diagramme montre les tables principales et leurs relations.

```mermaid
erDiagram
    PATIENTS {
        int id_patient PK
        string carte_rfid UK
        string nom
        string prenom
        date date_naissance
        string sexe
        string adresse
        string code_postal
        string ville
        string email UK
        string telephone
        string cin UK
        string numero_secu
        string mutuelle
        string groupe_sanguin
        string[] allergies
        string code_pin
        string medecin_traitant
        timestamp date_inscription
        boolean email_verified
        string verification_token
        timestamp verification_token_expires
        boolean actif
    }
    
    FAMILY_MEMBERS {
        int id_member PK
        int id_titulaire FK
        string nom
        string prenom
        date date_naissance
        string sexe
        string lien
        string tuteur
        string[] allergies
        string groupe_sanguin
        boolean actif
        timestamp date_ajout
    }
    
    SERVICES {
        int id_service PK
        string nom
        string description
        float tarif
        int duree_moyenne
        boolean actif
    }
    
    MEDECINS {
        int id_medecin PK
        string carte_rfid UK
        string nom
        string prenom
        string specialite
        int id_service FK
        string telephone
        string sexe
        string email
        string code_pin
        boolean disponible
        date date_embauche
        boolean actif
    }

    SALLES {
        int id_salle PK
        string numero_salle
        string batiment
        int etage
        int id_service FK
        boolean occupee
        int capacite
        string[] equipements
        timestamp derniere_utilisation
        boolean actif
    }

    CONSULTATIONS {
        int id_consultation PK
        int id_patient FK
        int id_member FK
        int id_service FK
        int id_medecin FK
        int id_salle FK
        string numero_file UK
        timestamp heure_arrivee
        timestamp heure_estimee
        timestamp heure_debut
        timestamp heure_fin
        string statut
        string motif
        string observations
        string diagnostic
        float montant_paye
        string mode_paiement
    }

    RENDEZ_VOUS {
        int id PK
        int patient_id FK
        int id_member FK
        int medecin_id FK
        date date_rdv
        time heure_rdv
        string motif
        string statut
        timestamp created_at
        timestamp updated_at
    }
    
    DISPONIBILITES {
        int id_dispo PK
        int medecin_id FK
        int jour_semaine
        time heure_debut
        time heure_fin
    }

    RESULTATS_EXAMENS {
        int id_resultat PK
        int id_consultation FK
        int rendez_vous_id FK
        int id_patient FK
        string type_examen
        timestamp date_examen
        string compte_rendu
        string conclusion
        string medecin_responsable
        jsonb fichiers_joints
    }

    FICHIERS_MEDICAUX {
        int id_fichier PK
        int id_resultat FK
        string type_fichier
        string nom_fichier
        string chemin_stockage
        int taille_ko
        timestamp date_upload
    }
    
    CONSTANTES_VITALES {
        int id_constante PK
        int id_patient FK
        int id_consultation FK
        int rendez_vous_id FK
        float temperature
        int frequence_cardiaque
        int spo2
        int tension_systolique
        int tension_diastolique
        timestamp timestamp
        string source
    }

    ORDONNANCES {
        int id_ordonnance PK
        int id_consultation FK
        int rendez_vous_id FK
        int id_medecin FK
        timestamp date_prescription
        jsonb medicaments
        string posologie
        int duree_traitement
        string instructions
        boolean envoyee_electronique
    }

    PAIEMENTS {
        int id PK
        int patient_id FK
        int rendez_vous_id FK
        float montant
        string methode_paiement
        string statut
        string stripe_payment_id
        string description
        timestamp date_paiement
    }

    NOTIFICATIONS {
        int id PK
        int patient_id FK
        string titre
        string message
        string type
        boolean lu
        timestamp created_at
    }

    PENDING_REGISTRATIONS {
        int id PK
        string email UK
        string verification_token
        timestamp verification_token_expires
        jsonb registration_data
        timestamp created_at
    }

    %% Relations
    PATIENTS ||--o{ FAMILY_MEMBERS : "possède"
    PATIENTS ||--o{ CONSULTATIONS : "effectue"
    PATIENTS ||--o{ RENDEZ_VOUS : "réserve"
    PATIENTS ||--o{ CONSTANTES_VITALES : "a"
    PATIENTS ||--o{ PAIEMENTS : "paie"
    PATIENTS ||--o{ NOTIFICATIONS : "reçoit"
    PATIENTS ||--o{ RESULTATS_EXAMENS : "a"
    
    FAMILY_MEMBERS ||--o{ CONSULTATIONS : "impliqué_dans"
    FAMILY_MEMBERS ||--o{ RENDEZ_VOUS : "impliqué_dans"
    
    SERVICES ||--o{ MEDECINS : "emploie"
    SERVICES ||--o{ SALLES : "contient"
    SERVICES ||--o{ CONSULTATIONS : "fournit"
    
    MEDECINS ||--o{ CONSULTATIONS : "mène"
    MEDECINS ||--o{ RENDEZ_VOUS : "assignés_à"
    MEDECINS ||--o{ DISPONIBILITES : "a"
    MEDECINS ||--o{ ORDONNANCES : "prescrit"
    
    SALLES ||--o{ CONSULTATIONS : "accueille"
    
    CONSULTATIONS ||--o{ RESULTATS_EXAMENS : "génère"
    CONSULTATIONS ||--o{ CONSTANTES_VITALES : "enregistre"
    CONSULTATIONS ||--o{ ORDONNANCES : "résulte_en"
    
    RENDEZ_VOUS ||--o{ RESULTATS_EXAMENS : "génère"
    RENDEZ_VOUS ||--o{ CONSTANTES_VITALES : "enregistre"
    RENDEZ_VOUS ||--o{ ORDONNANCES : "résulte_en"
    RENDEZ_VOUS ||--o{ PAIEMENTS : "requiert"

    RESULTATS_EXAMENS ||--o{ FICHIERS_MEDICAUX : "inclut"
```
