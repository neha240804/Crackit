---
doc_type: questions
role_family: machine_learning
---

# Machine learning interview questions

## Bias-variance trade-off
Fresher: What is the bias-variance trade-off? What does high bias look like compared with high variance?
Fresher: How would you tell from training and validation error whether a model is overfitting or underfitting?
Mid: Your validation error is much higher than training error. List three things you would try, in order, and why.
Senior: How does model capacity, dataset size and regularisation together shape the bias-variance curve? Where do modern over-parameterised networks fit in (double descent)?
Good answers cover: bias = error from wrong assumptions (underfitting), variance = sensitivity to training data (overfitting), total error = bias squared + variance + irreducible noise, learning/validation curves, fixes such as more data, regularisation, simpler/complex models, cross-validation.

## Overfitting, underfitting and regularisation
Fresher: What is overfitting and how do you detect it?
Fresher: Explain L1 versus L2 regularisation. Which one can produce sparse models and why?
Mid: How do dropout and early stopping reduce overfitting in neural networks?
Good answers cover: train/validation gap, cross-validation, L1 drives weights to exactly zero (feature selection), L2 shrinks weights smoothly, dropout as ensemble-like noise, early stopping on validation loss.

## Model evaluation and metrics
Fresher: When is accuracy a misleading metric? What would you use instead?
Fresher: Explain precision, recall and F1 with an example.
Mid: How do you choose a classification threshold for a fraud model? What does the ROC-AUC tell you and what does it hide?
Good answers cover: class imbalance, confusion matrix, precision/recall trade-off tied to business cost, PR-AUC for imbalanced data, calibration.

## Validation strategy and data leakage
Fresher: Why do we split data into train, validation and test sets?
Mid: What is data leakage? Give two realistic examples and how to prevent them.
Senior: How would you validate a model on time-series data?
Good answers cover: fitting preprocessing only on training folds, target leakage from future information, k-fold vs time-based splits, keeping a final untouched test set.

## Feature engineering and preprocessing
Fresher: How do you handle missing values and categorical features?
Mid: When does feature scaling matter and when does it not?
Good answers cover: imputation strategies, one-hot vs target encoding risks, scaling for distance/gradient-based models, tree models being scale-invariant.

## Tree models and ensembles
Fresher: How does a decision tree decide where to split?
Mid: Compare bagging (random forest) and boosting (XGBoost). Which reduces variance and which reduces bias?
Good answers cover: impurity measures (Gini, entropy), bagging reduces variance by averaging de-correlated trees, boosting reduces bias by fitting residuals sequentially, overfitting risks and key hyperparameters.

## Deep learning fundamentals
Fresher: What is backpropagation, in simple terms?
Mid: What causes vanishing gradients and how do modern architectures address it?
Good answers cover: chain rule, gradient flow, activation choices (ReLU), normalisation layers, residual connections, learning-rate schedules.

## MLOps and deployment
Mid: How would you take a trained model to production and know when it degrades?
Good answers cover: packaging (Docker, API), experiment tracking (MLflow), versioning data and models, monitoring data and prediction drift, retraining triggers.
