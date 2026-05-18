// ================================================
// 이미지 파일명을 여기서 바꾸세요
// ================================================
const IMAGE_FILES = [
  'tulip.jpg',       // 이미지 1
  'monitor.jpg',     // 이미지 2
  'hospital.jpg',    // 이미지 3
  'thermal.jpg',     // 이미지 4
];

// ================================================
// 폰트 파일명 (Helvetica .ttf 또는 .otf)
// ================================================
const FONT_FILE = 'Helvetica.ttf';

// ================================================

let imgs = [];
let font;
let items = [];
let dragging = null;
let offsetX, offsetY;

function preload() {
  font = loadFont(FONT_FILE);
  for (let f of IMAGE_FILES) {
    imgs.push(loadImage(f));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 텍스트 요소
  items.push({
    type: 'text',
    label: 'FAKE NEWS',
    x: width * 0.18,
    y: height * 0.12,
    size: width * 0.055,
  });

  items.push({
    type: 'text',
    label: 'AI',
    x: width * 0.48,
    y: height * 0.42,
    size: width * 0.045,
  });

  items.push({
    type: 'text',
    label: 'CONFIRMATION\nBIAS',
    x: width * 0.54,
    y: height * 0.58,
    size: width * 0.028,
  });

  // 이미지 요소 — x, y, w, h 직접 조절하세요
  items.push({ type: 'img', imgIndex: 0, x: width * 0.12, y: height * 0.28, w: width * 0.20, h: height * 0.30 });
  items.push({ type: 'img', imgIndex: 1, x: width * 0.25, y: height * 0.62, w: width * 0.18, h: height * 0.25 });
  items.push({ type: 'img', imgIndex: 2, x: width * 0.62, y: height * 0.18, w: width * 0.17, h: height * 0.28 });
  items.push({ type: 'img', imgIndex: 3, x: width * 0.64, y: height * 0.65, w: width * 0.19, h: height * 0.22 });
}

function draw() {
  background(255);

  // 고정 레이블 — 'Drag it!' (왼쪽 세로, 회전)
  push();
  textFont(font);
  textSize(13);
  fill(10);
  noStroke();
  translate(22, height / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  text('Drag it!', 0, 0);
  pop();

  // 고정 레이블 — 'Wherever you like!' (오른쪽 세로, 회전)
  push();
  textFont(font);
  textSize(13);
  fill(10);
  noStroke();
  translate(width - 22, height / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  text('Wherever you like!', 0, 0);
  pop();

  // 모든 드래그 가능 요소 그리기
  for (let item of items) {
    if (item.type === 'text') {
      drawTextItem(item);
    } else {
      drawImgItem(item);
    }
  }
}

function drawTextItem(item) {
  push();
  textFont(font);
  textStyle(BOLD);
  textSize(item.size);
  textAlign(LEFT, TOP);
  fill(10);
  noStroke();
  text(item.label, item.x, item.y);
  pop();
}

function drawImgItem(item) {
  let img = imgs[item.imgIndex];
  if (!img) return;

  // 원본 비율 유지 — w 기준으로 h 자동 계산
  let ratio = img.height / img.width;
  let drawW = item.w;
  let drawH = item.w * ratio;

  push();
  image(img, item.x, item.y, drawW, drawH);
  pop();

  // 히트박스도 실제 그려진 크기로 업데이트
  item.h = drawH;
}

// ================================================
// 드래그 로직
// ================================================

function mousePressed() {
  // 뒤에서 앞 순서로 탐색 (위에 있는 요소 우선)
  for (let i = items.length - 1; i >= 0; i--) {
    if (hitTest(items[i], mouseX, mouseY)) {
      dragging = i;
      offsetX = mouseX - items[i].x;
      offsetY = mouseY - items[i].y;
      // 클릭한 요소를 맨 앞으로
      let item = items.splice(i, 1)[0];
      items.push(item);
      dragging = items.length - 1;
      break;
    }
  }
}

function mouseDragged() {
  if (dragging !== null) {
    items[dragging].x = mouseX - offsetX;
    items[dragging].y = mouseY - offsetY;
  }
}

function mouseReleased() {
  dragging = null;
}

function hitTest(item, mx, my) {
  if (item.type === 'text') {
    textFont(font);
    textStyle(BOLD);
    textSize(item.size);
    let lines = item.label.split('\n');
    let w = 0;
    for (let l of lines) w = max(w, textWidth(l));
    let h = item.size * 1.3 * lines.length;
    return mx > item.x && mx < item.x + w &&
           my > item.y && my < item.y + h;
  } else {
    return mx > item.x && mx < item.x + item.w &&
           my > item.y && my < item.y + item.h;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
