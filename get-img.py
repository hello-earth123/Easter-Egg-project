import json
import base64

# # base64로 인코딩된 바이트
# encoded_bytes_data = b"SGVsbG8sIFdvcmxkIQ=="

# # base64 디코딩
# decoded_bytes_data = base64.b64decode(encoded_bytes_data)

# print(decoded_bytes_data)
# 출력: b'Hello, World!'


with open("result.txt", "r") as f:
    data = json.load(f)

img_data = data["candidates"][0]["content"]["parts"][1]["inlineData"]["data"]


with open("img.png", "wb") as f:
    f.write(base64.b64decode(img_data))
