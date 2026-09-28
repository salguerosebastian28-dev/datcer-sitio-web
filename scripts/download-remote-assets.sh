#!/usr/bin/env bash
#
# Descarga los assets que todavia se sirven desde datcer.com y reescribe
# index.html para que apunten a la carpeta local assets/.
# Ejecutar UNA sola vez, desde la raiz del proyecto:
#     bash scripts/download-remote-assets.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets/img assets/video

echo "Descargando 14 assets desde datcer.com..."
curl -fsSL --retry 3 -o "assets/img/cableado-estructurado.png" "https://www.datcer.com/Assets/Gemini_Generated_Image_3r66y93r66y93r66.png" && echo "  ok   assets/img/cableado-estructurado.png"
curl -fsSL --retry 3 -o "assets/img/sala-datacenter.png" "https://www.datcer.com/Assets/Gemini_Generated_Image_739i2b739i2b739i.png" && echo "  ok   assets/img/sala-datacenter.png"
curl -fsSL --retry 3 -o "assets/img/vista-aerea.png" "https://www.datcer.com/Assets/Gemini_Generated_Image_7gp7987gp7987gp7.png" && echo "  ok   assets/img/vista-aerea.png"
curl -fsSL --retry 3 -o "assets/img/equipo-tecnico.png" "https://www.datcer.com/Assets/Gemini_Generated_Image_ehpx34ehpx34ehpx.png" && echo "  ok   assets/img/equipo-tecnico.png"
curl -fsSL --retry 3 -o "assets/img/equipo-presentacion.png" "https://www.datcer.com/Assets/Gemini_Generated_Image_hy06bthy06bthy06.png" && echo "  ok   assets/img/equipo-presentacion.png"
curl -fsSL --retry 3 -o "assets/img/render-3d.png" "https://www.datcer.com/Assets/Gemini_Generated_Image_k3o6c7k3o6c7k3o6.png" && echo "  ok   assets/img/render-3d.png"
curl -fsSL --retry 3 -o "assets/img/equipo-diseno.png" "https://www.datcer.com/Assets/Gemini_Generated_Image_lgeziulgeziulgez.png" && echo "  ok   assets/img/equipo-diseno.png"
curl -fsSL --retry 3 -o "assets/img/plano-distribucion.png" "https://www.datcer.com/Assets/Gemini_Generated_Image_t097s6t097s6t097.png" && echo "  ok   assets/img/plano-distribucion.png"
curl -fsSL --retry 3 -o "assets/img/cliente-iff.png" "https://www.datcer.com/Assets/IFF_Company_Logo.png" && echo "  ok   assets/img/cliente-iff.png"
curl -fsSL --retry 3 -o "assets/img/unifilar-electrico.jpg" "https://www.datcer.com/Assets/WhatsApp%20Image%202026-05-15%20at%209.39.57%20AM.jpeg" && echo "  ok   assets/img/unifilar-electrico.jpg"
curl -fsSL --retry 3 -o "assets/img/cliente-smart-cloud.jpg" "https://www.datcer.com/Assets/images.jpg" && echo "  ok   assets/img/cliente-smart-cloud.jpg"
curl -fsSL --retry 3 -o "assets/img/cliente-liberty.webp" "https://www.datcer.com/Assets/liberty-networks-600x178.webp" && echo "  ok   assets/img/cliente-liberty.webp"
curl -fsSL --retry 3 -o "assets/img/cliente-seffia.png" "https://www.datcer.com/Assets/seffia.png" && echo "  ok   assets/img/cliente-seffia.png"
curl -fsSL --retry 3 -o "assets/img/uptime-institute.jpg" "https://www.datcer.com/Assets/up-inst-base-corp2.jpg" && echo "  ok   assets/img/uptime-institute.jpg"

echo ""
echo "Reescribiendo rutas en index.html..."
python3 - <<'PY'
import pathlib
p = pathlib.Path("index.html"); s = p.read_text(encoding="utf-8"); n = 0
M = {
    'https://www.datcer.com/Assets/Gemini_Generated_Image_3r66y93r66y93r66.png': "assets/img/cableado-estructurado.png",
    'https://www.datcer.com/Assets/Gemini_Generated_Image_739i2b739i2b739i.png': "assets/img/sala-datacenter.png",
    'https://www.datcer.com/Assets/Gemini_Generated_Image_7gp7987gp7987gp7.png': "assets/img/vista-aerea.png",
    'https://www.datcer.com/Assets/Gemini_Generated_Image_ehpx34ehpx34ehpx.png': "assets/img/equipo-tecnico.png",
    'https://www.datcer.com/Assets/Gemini_Generated_Image_hy06bthy06bthy06.png': "assets/img/equipo-presentacion.png",
    'https://www.datcer.com/Assets/Gemini_Generated_Image_k3o6c7k3o6c7k3o6.png': "assets/img/render-3d.png",
    'https://www.datcer.com/Assets/Gemini_Generated_Image_lgeziulgeziulgez.png': "assets/img/equipo-diseno.png",
    'https://www.datcer.com/Assets/Gemini_Generated_Image_t097s6t097s6t097.png': "assets/img/plano-distribucion.png",
    'https://www.datcer.com/Assets/IFF_Company_Logo.png': "assets/img/cliente-iff.png",
    'https://www.datcer.com/Assets/WhatsApp%20Image%202026-05-15%20at%209.39.57%20AM.jpeg': "assets/img/unifilar-electrico.jpg",
    'https://www.datcer.com/Assets/images.jpg': "assets/img/cliente-smart-cloud.jpg",
    'https://www.datcer.com/Assets/liberty-networks-600x178.webp': "assets/img/cliente-liberty.webp",
    'https://www.datcer.com/Assets/seffia.png': "assets/img/cliente-seffia.png",
    'https://www.datcer.com/Assets/up-inst-base-corp2.jpg': "assets/img/uptime-institute.jpg",
}
for k, v in M.items():
    if k in s: s = s.replace(k, v); n += 1
p.write_text(s, encoding="utf-8")
print(f"  {n} rutas reescritas en index.html")
PY

echo ""
echo "Listo: el sitio ya no depende de datcer.com."
