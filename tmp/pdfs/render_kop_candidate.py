from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader

output = "tmp/pdfs/kop_candidate.pdf"
width, height = landscape(A4)
pdf = canvas.Canvas(output, pagesize=(width, height))

group_width = 604.5
left = (width - group_width) / 2
pdf.drawImage(
    ImageReader("src/assets/logo_kop_dcktr.png"),
    left,
    height - 104,
    width=79.5,
    height=79.5,
    mask="auto",
    preserveAspectRatio=True,
)

copy_left = left + 79.5
copy_width = 525
copy_center = copy_left + copy_width / 2

def centered(text, y, font_size, char_space):
    line = pdf.beginText()
    line.setTextOrigin(copy_center, y)
    line.setFont("Helvetica-Bold", font_size)
    line.setCharSpace(char_space)
    measured = pdf.stringWidth(text, "Helvetica-Bold", font_size) + max(0, len(text) - 1) * char_space
    line.moveCursor(-measured / 2, 0)
    line.textLine(text)
    pdf.drawText(line)

centered("PEMERINTAH KOTA TANGERANG SELATAN", height - 40, 15.5, 3.2)
centered("DINAS CIPTA KARYA DAN TATA RUANG", height - 58, 14.5, 2.7)
centered("Kawasan Perkantoran Lengkong Wetan,", height - 75, 9.5, 1.6)
centered("Jl. Promoter No. 3 Kelurahan Lengkong Wetan, Kecamatan Serpong Kota Tangerang Selatan, Kode Pos 15322", height - 87, 7.0, 0.25)
centered("Telp./Fax: (021) 75685907, e-mail: dcktr.tangsel@gmail.com", height - 98, 7.0, 0.45)

pdf.setLineWidth(2.4)
pdf.line(22.7, height - 116, width - 22.7, height - 116)
pdf.setLineWidth(0.8)
pdf.line(22.7, height - 119, width - 22.7, height - 119)
pdf.setFont("Helvetica-Bold", 15)
pdf.drawString(22.7, height - 139, "Rekapitulasi Laporan SIKANDA")
pdf.setFont("Helvetica", 8)
pdf.drawString(22.7, height - 150, "Dicetak: 14 Juli 2026, 10.51 WIB")
pdf.save()
