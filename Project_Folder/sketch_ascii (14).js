// ================================================
// 파일명 설정
// ================================================
const LEFT_ART_FILE   = 'A.png';
const LEFT_MASK_FILE  = 'A_mask.png';
const RIGHT_ART_FILE  = 'L.png';
const RIGHT_MASK_FILE = 'L_mask.png';

// ================================================
// 오버레이 설정
// ================================================
const OVERLAY_TEXT = 'Confirmation bias ';
const COLS = 65;
const ROWS = 42;

// ================================================
// 이미지 배치 (both 모드)
// ================================================
const LEFT_CX  = 0.24;
const LEFT_CY  = 0.50;
const LEFT_SC  = 0.70;
const RIGHT_CX = 0.76;
const RIGHT_CY = 0.50;
const RIGHT_SC = 0.70;

// ================================================
// 전역 변수
// ================================================
let imgLeftArt,  imgLeftMask;
let imgRightArt, imgRightMask;
let mic;
let micReady = false;

let mode = 'both'; // 'both' | 'left' | 'right'
let prevDb    = -100;
let currentDb = -100;

let leftScale  = 1;
let rightScale = 1;
let targetLeftScale  = 1;
let targetRightScale = 1;

let gradientProgress = 0;

let overlay   = [];
let randTimer = 0;

// 데시벨 비교용
let peakA = -100;
let peakL = -100;

// ================================================

function preload() {
  imgLeftArt   = loadImage(LEFT_ART_FILE);
  imgLeftMask  = loadImage(LEFT_MASK_FILE);
  imgRightArt  = loadImage(RIGHT_ART_FILE);
  imgRightMask = loadImage(RIGHT_MASK_FILE);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Courier New');

  mic = new p5.AudioIn();
  mic.start();
  micReady = true;

  initOverlay();
}

// ================================================
// 오버레이 초기화
// ================================================
function initOverlay() {
  overlay = [];
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    overlay.push([]);
    for (let c = 0; c < COLS; c++) {
      overlay[r].push({
        ch: OVERLAY_TEXT[idx % OVERLAY_TEXT.length],
        active: random() < 0.5,
        idx: idx,
      });
      idx++;
    }
  }
}

// ================================================
// 오버레이 업데이트 — 3~4글자 묶음으로 깜빡
// ================================================
function updateOverlay() {
  randTimer++;
  if (randTimer % 2 !== 0) return;

  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      let groupSize = floor(random(3, 5));
      if (random() < 0.08) {
        let newState = !overlay[r][c].active;
        for (let g = 0; g < groupSize; g++) {
          if (c + g < COLS) {
            overlay[r][c + g].active = newState;
          }
        }
      }
      c += groupSize;
    }
  }
}

// ================================================
// draw
// ================================================
function draw() {
  background(255);
  updateOverlay();

  // 마이크 볼륨
  if (micReady) {
    let vol = mic.getLevel();
    currentDb = map(vol, 0, 1, -60, 0);
  }

  // 모드별 피크 업데이트
  if (mode === 'left')  peakA = max(peakA, currentDb);
  if (mode === 'right') peakL = max(peakL, currentDb);

  // 데시벨 → 스케일
  if (mode === 'left' || mode === 'right') {
    let scaleVal = map(constrain(currentDb, -60, 0), -60, 0, 0.6, 2.2);
    if (mode === 'left')  targetLeftScale  = scaleVal;
    else                  targetRightScale = scaleVal;
    prevDb = lerp(prevDb, currentDb, 0.1);
  }

  leftScale  = lerp(leftScale,  targetLeftScale,  0.07);
  rightScale = lerp(rightScale, targetRightScale, 0.07);

  // both 모드 글자색 — peakA > peakL이면 오렌지, peakL > peakA면 핑크
  let bothColor;
  if (peakA > peakL && peakA > -99) {
    bothColor = color(255, 120, 30, 200);   // 오렌지
  } else if (peakL > peakA && peakL > -99) {
    bothColor = color(255, 80, 180, 200);   // 핑크
  } else {
    bothColor = color(20, 20, 20, 200);     // 기본 검정
  }

  if (mode === 'both') {
    drawScene(bothColor);
    drawComparison();
  } else if (mode === 'left') {
    background(255);
    drawOverlayFull(color(255, 120, 30, 200)); // 오렌지 글자
    drawArtWithMask(imgLeftArt, imgLeftMask,
                    width * 0.5, height * 0.5, leftScale);
    drawDbMeter();
  } else {
    background(255);
    drawOverlayFull(color(255, 80, 180, 200)); // 핑크 글자
    drawArtWithMask(imgRightArt, imgRightMask,
                    width * 0.5, height * 0.5, rightScale);
    drawDbMeter();
  }
}

// ================================================
// both 모드 화면
// ================================================
function drawScene(overlayCol) {
  drawOverlayFull(overlayCol);
  drawArtWithMask(imgLeftArt,  imgLeftMask,
                  width * LEFT_CX,  height * LEFT_CY,  LEFT_SC);
  drawArtWithMask(imgRightArt, imgRightMask,
                  width * RIGHT_CX, height * RIGHT_CY, RIGHT_SC);
  drawHint();
}

// ================================================
// 중앙 데시벨 비교 표시
// ================================================
function drawComparison() {
  let arrow  = peakA >= peakL ? '>' : '<';
  let peakDb = max(peakA, peakL);
  let dbText = peakDb <= -99
    ? 'dB  --'
    : 'dB  ' + nf(peakDb, 1, 2);

  textFont('Courier New');
  noStroke();
  fill(20);
  textAlign(CENTER, CENTER);

  textStyle(BOLD);
  textSize(width * 0.036);
  text('A  ' + arrow + '  L', width / 2, height / 2 - height * 0.04);

  textStyle(NORMAL);
  textSize(width * 0.019);
  text(dbText, width / 2, height / 2 + height * 0.035);

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

// ================================================
// 마스크(흰배경) + 아트 그리기
// ================================================
function drawArtWithMask(art, mask, cx, cy, sc) {
  let dims = getImageDims(art, sc);
  let x = cx - dims.w / 2;
  let y = cy - dims.h / 2;

  imageMode(CORNER);
  image(mask, x, y, dims.w, dims.h);
  image(art,  x, y, dims.w, dims.h);
}

function getImageDims(img, sc) {
  let maxW  = width  * 0.42 * sc;
  let maxH  = height * 0.78 * sc;
  let ratio = img.width / img.height;
  let w, h;
  if (maxW / ratio <= maxH) {
    w = maxW; h = maxW / ratio;
  } else {
    h = maxH; w = maxH * ratio;
  }
  return { w, h };
}

// ================================================
// 오버레이 — 전체 화면 글자
// ================================================
function drawOverlayFull(col) {
  let cellW = width  / COLS;
  let cellH = height / ROWS;
  let sz    = min(cellW, cellH) * 0.75;

  textFont('Courier New');
  textStyle(NORMAL);
  textSize(sz);
  noStroke();
  fill(col);
  textAlign(CENTER, CENTER);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!overlay[r][c].active) continue;
      text(overlay[r][c].ch,
           c * cellW + cellW * 0.5,
           r * cellH + cellH * 0.5);
    }
  }
  textAlign(LEFT, BASELINE);
}

// ================================================
// 그라데이션 배경 (L 모드)
// ================================================
function drawGradientBg(side) {
  let col2 = color(255, 80, 180); // 핑크

  noStroke();
  let steps = 80;
  for (let i = 0; i < steps; i++) {
    let t = (i / steps) * gradientProgress;
    fill(lerpColor(color(255, 255, 255), col2, t));
    rect((width / steps) * i, 0, width / steps + 1, height);
  }
}

// ================================================
// UI — 힌트 / dB 미터
// ================================================
function drawHint() {
}

function drawDbMeter() {
  // 현재 모드에 맞는 이미지로 크기 계산
  let currentImg  = (mode === 'left') ? imgLeftArt  : imgRightArt;
  let currentScale = (mode === 'left') ? leftScale   : rightScale;
  let dims = getImageDims(currentImg, currentScale);

  let cx     = width * 0.5;
  let cy     = height * 0.5;
  let imgTop = cy - dims.h / 2;

  let dbFontSize = dims.w / 6;
  let dbY        = imgTop - dbFontSize * 0.3;

  let dbVal     = constrain(currentDb, -60, 0);
  let dbDisplay = 'dB  ' + nf(dbVal, 1, 2);

  noStroke();
  fill(20);
  textFont('Courier New');
  textStyle(NORMAL);
  textSize(dbFontSize);
  textAlign(CENTER, BOTTOM);
  text(dbDisplay, cx, dbY);

  textAlign(LEFT, BASELINE);
}

// ================================================
// 키보드
// ================================================
function keyPressed() {
  // 키 누를 때마다 AudioContext resume
  if (typeof getAudioContext === 'function') {
    getAudioContext().resume();
  }

  if (key === 'a' || key === 'A') {
    mode = 'left';
    gradientProgress = 0;
    prevDb = -100;
    targetLeftScale = 1;
    peakA = -100;
  } else if (key === 'l' || key === 'L') {
    mode = 'right';
    gradientProgress = 0;
    prevDb = -100;
    targetRightScale = 1;
    peakL = -100;
  } else if (keyCode === ESCAPE) {
    mode = 'both';
    gradientProgress = 0;
    leftScale  = 1; rightScale  = 1;
    targetLeftScale = 1; targetRightScale = 1;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
