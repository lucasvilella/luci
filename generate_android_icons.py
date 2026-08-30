import os
from PIL import Image, ImageDraw

def create_circular_icon(image: Image.Image, size: tuple) -> Image.Image:
    """Cria uma versão redonda com antialiasing."""
    img = image.resize(size, Image.Resampling.LANCZOS).convert("RGBA")
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    
    result = Image.new("RGBA", size, (0, 0, 0, 0))
    result.paste(img, (0, 0), mask=mask)
    return result

def create_foreground_icon(image: Image.Image, size: tuple) -> Image.Image:
    """Cria o foreground centralizado (safe zone de 66% no centro) com fundo transparente para ícone adaptativo."""
    img_size = int(size[0] * 0.72)
    resized_logo = image.resize((img_size, img_size), Image.Resampling.LANCZOS).convert("RGBA")
    
    fg = Image.new("RGBA", size, (0, 0, 0, 0))
    offset = ((size[0] - img_size) // 2, (size[1] - img_size) // 2)
    fg.paste(resized_logo, offset, mask=resized_logo if resized_logo.mode == "RGBA" else None)
    return fg

def main():
    src_path = "interfaces/mobile/public/icon-512x512.png"
    if not os.path.exists(src_path):
        print(f"Erro: {src_path} não encontrado")
        return

    base_img = Image.open(src_path)

    res_dir = "interfaces/mobile/android/app/src/main/res"

    densities = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432)
    }

    for folder, (std_size, fg_size) in densities.items():
        out_dir = os.path.join(res_dir, folder)
        os.makedirs(out_dir, exist_ok=True)

        # 1. ic_launcher.png (Quadrado / Com cantos)
        launcher_img = base_img.resize((std_size, std_size), Image.Resampling.LANCZOS)
        launcher_img.save(os.path.join(out_dir, "ic_launcher.png"), "PNG")

        # 2. ic_launcher_round.png (Redondo)
        round_img = create_circular_icon(base_img, (std_size, std_size))
        round_img.save(os.path.join(out_dir, "ic_launcher_round.png"), "PNG")

        # 3. ic_launcher_foreground.png (Adaptativo)
        fg_img = create_foreground_icon(base_img, (fg_size, fg_size))
        fg_img.save(os.path.join(out_dir, "ic_launcher_foreground.png"), "PNG")

        print(f"Gerado ícones para {folder}: {std_size}x{std_size} e FG {fg_size}x{fg_size}")

    # Atualiza ic_launcher_background.xml com o tom escuro profundo da Luci
    bg_xml_path = os.path.join(res_dir, "values", "ic_launcher_background.xml")
    with open(bg_xml_path, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0F0B1E</color>\n</resources>\n')
    print("Atualizado ic_launcher_background.xml para #0F0B1E")

if __name__ == "__main__":
    main()
