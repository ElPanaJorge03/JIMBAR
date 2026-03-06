import os, sys
os.environ['CLOUDINARY_URL'] = "cloudinary://276821656819155:JyuNPoceluUMnATjLYfazYA1MG0@duwe9afff"

import cloudinary
import cloudinary.uploader

try:
    with open("dummy.txt", "w") as f: f.write("dummy")
    res = cloudinary.uploader.upload("dummy.txt")
    print(res)
except Exception as e:
    import traceback
    with open("error_log.txt", "w") as f:
        traceback.print_exc(file=f)
