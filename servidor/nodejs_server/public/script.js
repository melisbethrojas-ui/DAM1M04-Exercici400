"use strict";

const midaCasella = 100;
const numFiles = 3;
const numColumnes = 3;

let tablero = [];
let fichasDOM = {};
let movimientos = 0;

function init() {

  const root = document.documentElement;
  root.style.setProperty("--mida", midaCasella + "px");
  root.style.setProperty("--files", numFiles);
  root.style.setProperty("--columnes", numColumnes);

  const refTablero = document.getElementById("tauler");

  // Crear casillas clicables
  for (let fila = 0; fila < numFiles; fila++) {
    for (let col = 0; col < numColumnes; col++) {

      const refCasella = document.createElement("div");
      refCasella.classList.add("casella");

      refCasella.addEventListener("click", () => clickCasilla(fila, col));

      refTablero.appendChild(refCasella);
    }
  }

  // Crear fichas dinámicamente
  const imagen = "imatges/curry 4k.jpg"; 
  const totalFichas = numFiles * numColumnes - 1;

  for (let id = 1; id <= totalFichas; id++) {
    const refFicha = document.createElement("div");
    refFicha.classList.add("fitxa");

    refFicha.style.backgroundImage = `url("${imagen}")`;

    refFicha.style.backgroundSize =
      `${midaCasella * numColumnes}px ${midaCasella * numFiles}px`;

    const posX = ((id - 1) % numColumnes) * midaCasella;
    const posY = Math.floor((id - 1) / numColumnes) * midaCasella;

    refFicha.style.backgroundPosition = `-${posX}px -${posY}px`;

    refTablero.appendChild(refFicha);
    fichasDOM[id] = refFicha;
  }

  document.getElementById("btnReinici").addEventListener("click", reinicia);

  reinicia();
}

/* 🔥 GENERAR TABLERO DINÁMICO */
function generarTablero() {
  const totalFichas = numFiles * numColumnes - 1;
  let contador = 1;
  const nuevo = [];

  for (let f = 0; f < numFiles; f++) {
    const fila = [];
    for (let c = 0; c < numColumnes; c++) {
      if (contador <= totalFichas) fila.push(contador);
      else fila.push(0); // hueco
      contador++;
    }
    nuevo.push(fila);
  }

  return nuevo;
}

/* 🔥 GENERAR ESTADO RESUELTO DINÁMICO */
function generarResuelto() {
  return generarTablero();
}

function reinicia() {

  tablero = generarTablero();  // tablero dinámico

  mezclar(200); // más pasos para 4x4

  movimientos = 0;
  document.getElementById("info").textContent = "Movimientos: 0";
  document.getElementById("mensaje").textContent = "";

  actualizarDOM();
}

function mezclar(pasos) {
  for (let i = 0; i < pasos; i++) {
    const hueco = buscarHueco();
    const ady = obtenerAdyacentes(hueco.fila, hueco.col);
    const mov = ady[Math.floor(Math.random() * ady.length)];
    intercambiar(mov.fila, mov.col, hueco.fila, hueco.col);
  }
}

function buscarHueco() {
  for (let f = 0; f < numFiles; f++) {
    for (let c = 0; c < numColumnes; c++) {
      if (tablero[f][c] === 0) return { fila: f, col: c };
    }
  }
}

function obtenerAdyacentes(f, c) {
  const dirs = [
    { df: -1, dc: 0 },
    { df: 1, dc: 0 },
    { df: 0, dc: -1 },
    { df: 0, dc: 1 }
  ];

  return dirs
    .map(d => ({ fila: f + d.df, col: c + d.dc }))
    .filter(p => p.fila >= 0 && p.fila < numFiles && p.col >= 0 && p.col < numColumnes);
}

function clickCasilla(fila, col) {
  const hueco = buscarHueco();

  const df = Math.abs(fila - hueco.fila);
  const dc = Math.abs(col - hueco.col);

  if (df + dc === 1) {
    intercambiar(fila, col, hueco.fila, hueco.col);
    movimientos++;
    document.getElementById("info").textContent = `Movimientos: ${movimientos}`;
    actualizarDOM();
    comprobarResuelto();
  }
}

function intercambiar(f1, c1, f2, c2) {
  const temp = tablero[f1][c1];
  tablero[f1][c1] = tablero[f2][c2];
  tablero[f2][c2] = temp;
}

function actualizarDOM() {

  // Mover fichas con TRANSFORM
  for (let f = 0; f < numFiles; f++) {
    for (let c = 0; c < numColumnes; c++) {
      const valor = tablero[f][c];
      if (valor !== 0) {
        const ficha = fichasDOM[valor];
        ficha.style.transform = `translate(${c * midaCasella}px, ${f * midaCasella}px)`;
      }
    }
  }

  // Mover casillas clicables
  const casillas = document.querySelectorAll(".casella");
  let index = 0;

  for (let f = 0; f < numFiles; f++) {
    for (let c = 0; c < numColumnes; c++) {
      const casilla = casillas[index];
      casilla.style.transform = `translate(${c * midaCasella}px, ${f * midaCasella}px)`;
      index++;
    }
  }
}

function comprobarResuelto() {
  const resuelto = generarResuelto();

  for (let f = 0; f < numFiles; f++) {
    for (let c = 0; c < numColumnes; c++) {
      if (tablero[f][c] !== resuelto[f][c]) return;
    }
  }

  document.getElementById("mensaje").textContent =
    `¡Puzzle resuelto en ${movimientos} movimientos!`;
}

window.onload = init;
