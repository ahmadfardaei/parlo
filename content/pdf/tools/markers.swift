// Prints "<marker> <page>" for each hidden marker (MRK…END) in a PDF. Used to number the table of contents.
import PDFKit
let doc = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1]))!
for i in 0..<doc.pageCount {
  let s = doc.page(at: i)?.string ?? ""
  let re = try! NSRegularExpression(pattern: "MRK([A-Za-z0-9-]+)END")
  for m in re.matches(in: s, range: NSRange(s.startIndex..., in: s)) { print(String(s[Range(m.range(at: 1), in: s)!]), i + 1) }
}
