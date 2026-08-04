import os
import argparse
import urllib.request
import zipfile

DATASET_URLS = {
    "coco": "http://images.cocodataset.org/annotations/annotations_trainval2017.zip",
    "sku-110k": "https://github.com/eg400/SKU-110K/raw/master/annotations/annotations_paper.tar.gz",
    "retail-checkout": "https://github.com/jinfagang/retail-product-checkout-dataset/archive/refs/heads/master.zip"
}

def download_file(url: str, output_path: str):
    print(f"Downloading {url} to {output_path}...")
    try:
        urllib.request.urlretrieve(url, output_path)
        print("Download completed successfully.")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Surveillance Dataset Downloader Utilities")
    parser.add_argument("--dataset", choices=["coco", "sku-110k", "retail-checkout", "all"], default="all", help="Target dataset to configure")
    parser.add_argument("--dir", default="./storage/datasets", help="Configurable download path")
    args = parser.parse_args()

    os.makedirs(args.dir, exist_ok=True)
    
    targets = DATASET_URLS.keys() if args.dataset == "all" else [args.dataset]
    
    for key in targets:
        url = DATASET_URLS[key]
        filename = url.split("/")[-1]
        output_file = os.path.join(args.dir, filename)
        
        # Verify if dataset annotation file already exists
        if os.path.exists(output_file):
            print(f"Dataset {key} already exists at {output_file}. Skipping.")
        else:
            download_file(url, output_file)

if __name__ == "__main__":
    main()
