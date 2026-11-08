async function inspectTail() {
  const res = await fetch("http://localhost:3000/product/parle-g-glucose-biscuits");
  const html = await res.text();
  console.log("Total length:", html.length);
  console.log("Tail (last 2000 chars):");
  console.log(html.substring(html.length - 2000));
}
inspectTail();
