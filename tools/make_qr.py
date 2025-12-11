import qrcode
import sys

url = sys.argv[1] if len(sys.argv) > 1 else 'https://kydyrzhanmaratuly-hub.github.io/Xalisa/'
out = sys.argv[2] if len(sys.argv) > 2 else 'site/qrcode.png'

img = qrcode.make(url)
img.save(out)
print(f"Saved {out} for {url}")
