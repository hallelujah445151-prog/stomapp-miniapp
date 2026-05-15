import requests
import json
import sys

# Устанавливаем кодировку UTF-8 для Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

BASE_URL = "http://localhost:8000"

def test_api():
    print("Testing StomApp API...")
    print("=" * 50)
    
    # 1. Test root endpoint
    print("\n[1] Testing root endpoint:")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"[OK] Status: {response.status_code}")
        print(f"[INFO] Response: {response.json()}")
    except Exception as e:
        print(f"[ERROR] {e}")
        return False

    # 2. Test getting doctors
    print("\n[2] Testing doctors reference:")
    try:
        headers = {"Authorization": "Bearer test_token"}
        response = requests.get(f"{BASE_URL}/api/references/doctors", headers=headers)
        print(f"[OK] Status: {response.status_code}")
        if response.status_code == 200:
            print(f"[INFO] Doctors: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        else:
            print(f"[ERROR] {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # 3. Test getting technicians
    print("\n[3] Testing technicians reference:")
    try:
        headers = {"Authorization": "Bearer test_token"}
        response = requests.get(f"{BASE_URL}/api/references/technicians", headers=headers)
        print(f"[OK] Status: {response.status_code}")
        if response.status_code == 200:
            print(f"[INFO] Technicians: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        else:
            print(f"[ERROR] {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # 4. Test getting work types
    print("\n[4] Testing work types reference:")
    try:
        headers = {"Authorization": "Bearer test_token"}
        response = requests.get(f"{BASE_URL}/api/references/work-types", headers=headers)
        print(f"[OK] Status: {response.status_code}")
        if response.status_code == 200:
            print(f"[INFO] Work Types: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        else:
            print(f"[ERROR] {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # 5. Test getting orders
    print("\n[5] Testing orders endpoint:")
    try:
        headers = {"Authorization": "Bearer test_token"}
        response = requests.get(f"{BASE_URL}/api/orders", headers=headers)
        print(f"[OK] Status: {response.status_code}")
        if response.status_code == 200:
            orders = response.json()
            print(f"[INFO] Orders count: {len(orders['orders'])}")
            if orders['orders']:
                print(f"[INFO] First order: {json.dumps(orders['orders'][0], indent=2, ensure_ascii=False)}")
        else:
            print(f"[ERROR] {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    print("\n" + "=" * 50)
    print("[SUCCESS] Testing completed!")
    print("[INFO] API Documentation: http://localhost:8000/docs")

if __name__ == "__main__":
    test_api()