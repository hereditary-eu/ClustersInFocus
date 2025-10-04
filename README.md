# Clusters in Focus

Welcome to the code behind _Clusters in Focus: A Simple and Robust Detail-On-Demand Dashboard for Patient Data_!
This work was presented at the EG [VCBM 2025](https://conferences.eg.org/vcbm2025/) at TU Delft.

![Clusters in Focus Preview](./screenshot.png)

Exploring tabular datasets to understand how different feature pairs partition data into meaningful cohorts is crucial in domains such as biomarker discovery, yet comparing clusters across multiple feature pair projections is challenging. We introduce Clusters in Focus, an interactive visual analytics dashboard designed to address this gap. Clusters in Focus employs a threepanel coordinated view: a Data Panel offers multiple perspectives (tabular, heatmap, condensed with histograms / SHAP values) for initial data exploration; a Selection Panel displays the 2D clustering (K-Means/DBSCAN) for a user-selected feature pair; and a novel Cluster Similarity Panel featuring two switchable views for comparing clusters. A ranked list enables the identification of top-matching feature pairs, while an interactive similarity matrix with reordering capabilities allows for the discovery of global structural patterns and groups of related features. This dual-view design supports both focused querying and broad visual exploration. A use case on a Parkinson's disease speech dataset demonstrates the tool's effectiveness in revealing relationships between different feature pairs characterizing the same patient subgroup.

To run the application:

```bash
docker compose build
docker compose up
```

## Example Dataset

For the presentation and demonstration of an exemplary use case, we used the following dataset:

https://www.kaggle.com/datasets/debasisdotcom/parkinson-disease-detection/data

## Citation

If you found this tool helpful for your work, please cite it as follows:

```bibtex
@inproceedings{2025-clusters-in-focus,
	booktitle = {Eurographics Workshop on Visual Computing for Biology and Medicine},
	editor    = {Garrison, Laura and Krueger, Robert},
	title     = {{Clusters in Focus: A Simple and Robust Detail-On-Demand Dashboard for Patient Data}},
	author    = {Schilcher, Lukas and Waldert, Peter and Kantz, Benedikt and Schreck, Tobias},
	year      = {2025},
	publisher = {The Eurographics Association},
	issn      = {2070-5786},
	isbn      = {978-3-03868-276-9},
	doi       = {10.2312/vcbm.20251250}
}
```
