// Cuts the hero kitten out of kedi.png with Vision and applies the same mask to the closed-eye image,
// so both layers line up exactly. Usage: swift src/kedi.swift kedi.png kedi-goz-kapali.png outdir
import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins

let a = CommandLine.arguments
let open = CIImage(contentsOf: URL(fileURLWithPath: a[1]))!
let closed = CIImage(contentsOf: URL(fileURLWithPath: a[2]))!
let outDir = a[3]
let handler = VNImageRequestHandler(ciImage: open)
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
let res = req.results!.first!
let mask = CIImage(cvPixelBuffer: try res.generateScaledMaskForImage(forInstances: res.allInstances, from: handler))
// Crop box in top-down pixels of the 2400 x 1792 source.
let H = open.extent.height
let box = CGRect(x: 600, y: H - 1470, width: 1200, height: 1470 - 440)
let ctx = CIContext()
let srgb = CGColorSpace(name: CGColorSpace.sRGB)!
for (name, src) in [("open", open), ("closed", closed)] {
  let f = CIFilter.blendWithMask()
  f.inputImage = src; f.backgroundImage = CIImage.empty(); f.maskImage = mask
  let cut = f.outputImage!.cropped(to: box).transformed(by: CGAffineTransform(translationX: -box.minX, y: -box.minY))
  for w in [1200.0, 760.0] {
    let s = w / box.width
    let img = cut.transformed(by: CGAffineTransform(scaleX: s, y: s))
    try ctx.writePNGRepresentation(of: img, to: URL(fileURLWithPath: "\(outDir)/kedi-\(name)-\(Int(w)).png"), format: .RGBA8, colorSpace: srgb)
  }
}
// How well do the two renders line up? Mean difference over an ear, away from the eyes.
let ear = CGRect(x: 780, y: H - 800, width: 200, height: 200)
let d = CIFilter.differenceBlendMode(); d.inputImage = open.cropped(to: ear); d.backgroundImage = closed.cropped(to: ear)
let avg = CIFilter.areaAverage(); avg.inputImage = d.outputImage!; avg.extent = ear
var px = [UInt8](repeating: 0, count: 4)
ctx.render(avg.outputImage!, toBitmap: &px, rowBytes: 4, bounds: CGRect(x: 0, y: 0, width: 1, height: 1), format: .RGBA8, colorSpace: srgb)
print("ear diff", px)
