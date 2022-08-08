const srcs = [
  './assets/bb38fb7c1073eaee1755f81131f11d21.jpg',
  './assets/1b809d9a2bdf3ecc481322d7c9223c21.jpg',
  './assets/b6d65b2f12646a9fd6b8cb2b020d754f.jpg',
  './assets/730ea9c393def7975deceb48b3eb6fe4.jpg'
]

const root = document.querySelector('#root')

for (let src of srcs) {
  const img = document.createElement('div');
  img.style.backgroundImage = `url(${src})`;
  img.style.backgroundSize = 'contain';
  root.appendChild(img);
}
const children = root.children;
console.log(children)

let position = 0;
let mark = false
let startX = 0;
root.addEventListener('mousedown', event => {
  mark = true;
  startX= event.clientX;
})
document.addEventListener('mousemove', function (event) {
  if (!mark) return false
  let x = event.clientX - startX;
  // let current = position - Math.ceil(x / 500);
  let current = position - Math.ceil((x - x % 500) / 500);
  // let current = position - Math.round(x % 500 / 500);
  for (let offset of [-1, 0, 1]) {
    let pos = current + offset;
    pos = (pos + children.length) % children.length
    children[pos].style.transition = 'none';
    children[pos].style.transform = `translateX(${- pos * 500 + offset * 500 + x % 500}px)`
  }
});

document.addEventListener('mouseup', function (event) {
  mark = false;
  let x = event.clientX - startX;
  position = position - Math.round(x / 500);
  for (let offset of [0, -Math.sign(Math.round(x / 500) - x + 250 * Math.sign(x))]) {
    // for (let offset of [0, Math.round(x % 500 / 500)]) {
    let pos = position + offset;
    pos = (pos + children.length) % children.length
    children[pos].style.transition = '';
    children[pos].style.transform = `translateX(${- pos * 500 + offset * 500}px)`
  }
});