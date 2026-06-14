const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;

export function validatePdf(file: File): string | null {
  if (file.type && file.type !== 'application/pdf') {
    return 'Выберите файл PDF.';
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return 'Выберите файл с расширением .pdf.';
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return 'PDF больше 25 МБ. Такая книга может упереться в лимиты модели или тарифа.';
  }

  return null;
}

export function readPdfAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не удалось прочитать PDF.'));
    reader.readAsDataURL(file);
  });
}
