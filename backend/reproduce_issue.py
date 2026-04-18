import requests
import os

url = "http://localhost:5000/api/predict"
image_path = "/Users/arpitkhandelwal/Downloads/project 2/archive (6)/Database_134_Angiograms/1.pgm"

def test_predict():
    with open(image_path, "rb") as f:
        img_data = f.read()
    
    # First call
    files = {'image': ('1.pgm', img_data, 'image/pgm')}
    r1 = requests.post(url, files=files)
    print("Call 1:", r1.json()['result']['label'], r1.json()['result']['confidence'])
    
    # Second call
    files = {'image': ('1.pgm', img_data, 'image/pgm')}
    r2 = requests.post(url, files=files)
    print("Call 2:", r2.json()['result']['label'], r2.json()['result']['confidence'])

if __name__ == "__main__":
    test_predict()
