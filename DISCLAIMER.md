# Clusters in Focus: Disclaimer

This file is the release disclaimer required by the HEREDITARY misuse self-assessment (D9.1, Ethics Requirement 1). Clusters in Focus is a visualisation tool for tabular data. It makes no statement about any individual and has no clinical function.

> **Research use only. Not a medical device.**
> This software was developed in the HEREDITARY project as a research prototype. It has not been assessed or certified under the EU Medical Device Regulation (EU) 2017/745. It must not be used to diagnose, treat, monitor or make any other decision about individual patients.

<!-- To be shown in the user interface:
"Research prototype of the HEREDITARY project. Not a medical device and not for clinical use. Do not enter personal or patient data." (not yet shown, as of 2026-10-18) -->

**Do not upload personal or patient data to the public demo.** Datasets uploaded through the interface are stored in the server-side database of that deployment and are visible to every other visitor of it. For real data, self-host the application with the provided `docker-compose.yml`.

## 1. Overview

| Field | Value |
|---|---|
| Name | Clusters in Focus |
| Version | v0.1.0 |
| Type | Demo or web application (with source code and a bundled public demonstration dataset) |
| Owner partner and contact | TU Graz (IVC); Peter Waldert, peter.waldert@tugraz.at |
| License | MIT (see [`LICENSE`](LICENSE)), in line with the WP5 licensing policy (D5.2, "Component FAIRification"). |
| Repository and DOI | https://github.com/hereditary-eu/ClustersInFocus — demo: https://hereditary.cgv.tugraz.at/cif — paper: https://doi.org/10.2312/vcbm.20251250 — software archive: https://doi.org/10.5281/zenodo.17661296 |
| Release date | Repository created 2025-04-30; presented at VCBM 2025 on 2025-10-02; tag `v0.1.0` released 2025-11-20; archived on Zenodo in November 2025 |
| Related task or deliverable | WP5, T5.1; D5.1, D5.2 |
| How to cite | Schilcher, Waldert, Kantz, Schreck, *Clusters in Focus: A Simple and Robust Detail-On-Demand Dashboard for Patient Data*, VCBM 2025. https://doi.org/10.2312/vcbm.20251250 |

## 2. Intended use

**Primary intended use.** Exploratory visual analysis of tabular biomedical data. Clusters in Focus uses a three-panel coordinated view: a Data Panel (tabular, heatmap, condensed view with histograms and SHAP values), a Selection Panel showing the 2D clustering of a user-selected feature pair, and a Cluster Similarity Panel that ranks every other feature pair by how far its clusters overlap the selected one. The research question it supports is which feature pairs partition a cohort in the same way, so that a subgroup found in one projection can be recognised in others — for example in biomarker discovery.

**Intended users.** Biomedical and visualization researchers, data scientists, and developers building on cluster-comparison views.

**Out-of-scope uses.** This release must not be used for
- clinical diagnosis, prognosis or treatment of individual patients;
- decisions about individuals, such as insurance, employment or access to care;
- re-identification of individuals or linkage with other data sources — the tool re-identifies abstract subgroups across projections, never people;
- populations, devices or data types not described in Section 3; in particular, uploading identifiable or patient-level data into a shared deployment.

## 3. Data provenance

| Dataset | Source partner | Type | Population | Ethics approval or access conditions |
|---|---|---|---|---|
| `parkinsonsdata.csv` — biomedical voice measurements for Parkinson's disease detection (UCI / Little et al., redistributed on [Kaggle](https://www.kaggle.com/datasets/debasisdotcom/parkinson-disease-detection/data)) | External, public | Public, no direct identifiers | 195 sustained-phonation recordings from 31 subjects, 23 of them with Parkinson's disease; single study | Publicly redistributed research dataset. No HEREDITARY partner data used; no ethics approval under D2.2 Table 1 required. |

The dataset ships pre-loaded in the SQLite database `backend/app.db` so that the demonstration in the paper can be reproduced. This repository and the released files contain no personal data, pseudonymized records, identifiers or pseudonymization keys. The committed `backend/.env` holds only host, port, thread count and the local database path — no credentials. A pattern scan of the full git history (66 commits, 2026-10-18) for API keys, tokens, private keys and passwords found none.

## 4. Method

- **Algorithm or architecture.** React/TypeScript frontend and a FastAPI backend over SQLite. For a user-selected feature pair the backend computes a 2D clustering (K-Means or DBSCAN, scikit-learn). Selecting one cluster `C_AB` scores every other feature-pair clustering `C_XY:k` by the Jaccard index `J = |C_AB ∩ C_XY:k| / |C_AB ∪ C_XY:k|`, presented both as a ranked list and as a reorderable similarity matrix. SHAP values for the condensed data view are computed on demand from an XGBoost surrogate.
- **Training setting.** Not applicable. Nothing is trained ahead of time and no model weights are released; clustering and SHAP values are computed per request from the selected dataset.
- **Privacy techniques.** None applied, and none required for the released configuration: the bundled dataset is public and carries no identifiers. Data a user uploads is neither anonymized nor isolated per user — see Section 6.

## 5. Performance

- **Evaluation data.** The published use case on the public Parkinson's speech dataset (VCBM 2025 paper, Figure 1 and Section "Use Case"). TRL 3–4, no clinical validation.
- **Metrics and results.** The tool is a visual-analytics interface, not a predictor, so there is no accuracy figure. Its quantitative output is the Jaccard overlap between clusterings; the use case shows it surfacing distinct feature pairs that characterise the same patient subgroup.
- **Results by subgroup.** Not applicable — no model output per individual, hence no subgroup performance to report.

## 6. Known limitations and risks

- **Generalizability.** The views assume numeric tabular data of moderate size that fits in memory on the backend. Behaviour with very wide tables (the pairwise feature-pair comparison grows quadratically with the number of features), with mostly categorical columns, or with heavy missingness has not been characterised.
- **Known biases and confounders.** Cluster structure depends on the chosen algorithm, `k` and the scaling of the two selected features; a high Jaccard overlap is evidence of shared membership, not of a causal or biological relationship. The bundled dataset is a single small study (31 subjects) and is not representative of any population.
- **Failure modes.** DBSCAN parameters that collapse the data into one cluster or into noise make the similarity panel uninformative; clusterings computed on different numbers of rows are not comparable by Jaccard overlap; SHAP values from the surrogate model are an approximation and should not be read as feature importances of any deployed model.
- **Privacy risks.** No model weights are released, so no membership-inference or model-inversion test was run; it was judged unnecessary. The real privacy risk is operational: the demo's upload endpoint (`POST /dataset/upload`) stores uploaded tables in the shared server-side database, where they are listed to every visitor, with no per-user separation and no automatic deletion. The database is cleared through `GET /dataset/reset`, which is unauthenticated, so any visitor can wipe the shared demo. Do not upload personal or patient data to a shared deployment.

## 7. Responsible use and reporting

- **Terms of use.** Public demo at https://hereditary.cgv.tugraz.at/cif with a shared database that any visitor can upload to or clear; self-hosting via `docker compose up` for any non-public data. Licensed under MIT (`LICENSE`).
- **Pre-release actions.** This disclaimer is linked from the repository README since 2026-10-18. Since the same date the repository carries an MIT `LICENSE` file. Still open: show the research-use and no-upload notice in the interface.
- **Contact for misuse or vulnerability reports.** peter.waldert@tugraz.at

## 8. Acknowledgement

Funded by the European Union under grant agreement No 101137074 (HEREDITARY). Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or the European Health and Digital Executive Agency (HaDEA). Neither the European Union nor the granting authority can be held responsible for them.
