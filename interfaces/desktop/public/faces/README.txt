=====================================================
PASTA DE FOTOS DE USUÁRIOS — Luci BIOMETRIC FACIAL
=====================================================

Como adicionar novos usuários por foto:

1. Adicione a foto do usuário nesta pasta: public/faces/
   Exemplo: 
   - lucas.jpg
   - mariana.jpg
   - gabriel.png

2. Adicione o registro no arquivo faces.json:
   [
     { "name": "Lucas", "file": "lucas.jpg" },
     { "name": "Mariana", "file": "mariana.jpg" }
   ]

3. A Luci fará a leitura da imagem e o cálculo dos pontos faciais 
   automaticamente ao inicializar o sistema!
