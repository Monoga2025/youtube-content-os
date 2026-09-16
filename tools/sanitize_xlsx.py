"""Remove Excel absolute-path compatibility metadata after a COM round trip."""
import re,sys,zipfile,tempfile,os
source=sys.argv[1]
fd,temp=tempfile.mkstemp(suffix='.xlsx');os.close(fd)
try:
 with zipfile.ZipFile(source,'r') as src,zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as dst:
  for info in src.infolist():
   payload=src.read(info.filename)
   if info.filename.endswith('.xml'):
    payload=re.sub(br'<x15ac:absPath\b[^>]*/>',b'',payload)
    payload=re.sub(br'<x15ac:absPath\b[^>]*>.*?</x15ac:absPath>',b'',payload,flags=re.DOTALL)
   dst.writestr(info,payload)
 os.replace(temp,source)
finally:
 if os.path.exists(temp):os.unlink(temp)