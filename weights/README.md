# Weights Directory

Place the 4 trained YOLOv8 `best.pt` files here after downloading from Kaggle:

| File | Model | Kaggle Path |
|---|---|---|
| `rider_best.pt` | Rider detector | `/kaggle/working/runs/full/weights/best.pt` |
| `helmet_best.pt` | Helmet classifier | `/kaggle/working/runs/helmet_no_helmet_train_val/weights/best.pt` |
| `plate_best.pt` | Plate detector | `/kaggle/working/runs/plate_train_val/weights/best.pt` |
| `twowheeler_best.pt` | Two-wheeler detector | `/kaggle/working/runs/twowheeler_train_val/weights/best.pt` |

## How to download from Kaggle

1. After training completes, click **"Save Version"** in your Kaggle notebook
2. Go to the notebook's **Output** tab
3. Navigate to `runs/<model_name>/weights/`
4. Download `best.pt` for each model
5. Rename and place them here
