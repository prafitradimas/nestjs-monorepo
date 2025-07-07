export interface PdfService {
  /*
   * @param html: string - html string
   * @returns Promise<Buffer> - PDF as Buffer
   * */
  fromHtml(html: string): Promise<Buffer>;

  /*
   * @param template: string - template file name
   * @param data: any - data to be passed to the template
   * @returns Promise<Buffer> - PDF as Buffer
   * */
  fromHtmlTemplate(template: string, data: Object): Promise<Buffer>;
}
