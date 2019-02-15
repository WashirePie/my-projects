let wWidth  = window.innerWidth;
let wHeight = window.innerHeight;

const red   = "#b72828"
const green = "#3bb728"
const yellow = "#998429"

let CurrentModule;
let CurrentNetwork;

let Data;

function preload() {
  /* The loadStrings function returns an array, indexed by the lines of the loaded file
  syntax: loadStrings(filename,callback,errorCallback)*/
  Data = new Resource(loadStrings("https://raw.githubusercontent.com/WashirePie/CFX.Web/master/%2BDOC/RAW/mnemonic.mnc"));
}


function setup() {
  createCanvas(wWidth, wHeight);
}


function draw() {
  background(51);
  let warn = 0;
  /* Run all sequences to analyze the mnemonic */
  warn += getDefinitions          (Data);
  warn += analyzeLogic            (Data);
  warn += analyzeDependencies     (Data);
  warn += analyzeResults          (Data);
  console.log(Data.usedUndefinedInstructions);
  if (warn != 0) {console.log("%c There have been " + warn + " Warnings!", "background: #b72828; color: #ffffff");}

  noLoop();
}


function getDefinitions(source) {
  let w = 0;
  /* Get all definitions in the current file */
  console.log("Getting definitions...");
  for (let line of source.sourceLines) {
    /* Check if line contains a multi bit definition */
    let MBD = source.getMultiBitDefinitions(line);
    if (MBD != null) {source.MBDMemory.push(MBD);}
    /* Check if line contains a single bit definition */
    let SBD = source.getSingleBitDefinitions(line);
    if (SBD != null) {source.SBDMemory.push(SBD);}
    /* Check if line contains a program number definition */
    let PRGNBR = source.getModuleNumberDefinition(line);
    if (PRGNBR != null) {source.Modules.push(PRGNBR);}
    /* Check if line contains a program title definition (they are only shown
    where the program is called in the file). Add to equally named existing module */
    source.getModuleTitleDefinition(line);
  }
  console.log("-- Multibit definitions  : " + source.MBDMemory.length);
  console.log("-- Singlebit definitions : " + source.SBDMemory.length);
  console.log("-- Module definitions    : " + source.Modules.length);
  finishSequence(w, 2);
  return w
}


function analyzeLogic(source) {
  let w = 0;
  /* Get all logic events in the whole file */
  console.log("Analyzing logic...");
  let lines = source.sourceLines;
  for (let i = 0; i < lines.length; i++) {
    /* Update the current module */
    let MODULE = source.getCurrentModule(lines[i], lines[i+1]);
    if (MODULE != null) {CurrentModule = MODULE;}
    /* Update the current network */
    let NETWORK = source.getCurrentNetwork(lines[i]);
    if (NETWORK != null) {CurrentNetwork = NETWORK;}
    /* If both CurrentNetwork & CurrentModule aren't null, we can begin to check
    for operations */
    if (CurrentModule != null && CurrentNetwork != null) {
      let op = null;
      /* Bitwise operations */
      op = source.getReadBitOperation(lines[i]);
      if (op != null) {source.bitReadOperations.push (new BitOperation(op, CurrentModule, CurrentNetwork, i));}
      op = source.getWriteBitOperation(lines[i]);
      if (op != null) {source.bitWriteOperations.push(new BitOperation(op, CurrentModule, CurrentNetwork, i));}
      /* Instructions */
      op = source.InstructionLogicData(lines, i);
      if (op != null) {source.instructionOperations.push(new InstructionOperation(op.instruction,
                                                                                  op.number,
                                                                                  op.format,
                                                                                  op.formatLength,
                                                                                  op.reads,
                                                                                  op.writes,
                                                                                  CurrentModule,
                                                                                  CurrentNetwork,
                                                                                  i));}
    }
  }
  console.log("-- Found bitwise Read operations:");
  console.log(source.bitReadOperations);
  console.log("-- Found bitwise Write operations:");
  console.log(source.bitWriteOperations);
  console.log("-- Found instruction operations:");
  console.log(source.instructionOperations);
  finishSequence(w, 2);
  return w
}


function analyzeDependencies(source) {
  let w = 0;
  /* Get all logic events in the whole file */
  console.log("Analyzing Dependencies...");

  finishSequence(w, 2);
  return w
}


function analyzeResults(source) {
  let w = 0;
  console.log("Analyzing Results...");

  /* Check if all defined programs appear in the logic */
  console.log("-- Unused, but defined Modules:");
  let unused = [];
  for (let i = 0; i < source.Modules.length; i++) {
    for (let j = 0; j < source.Modules[i].length; j++) {
      if (source.Modules[i][j] == undefined) {
        unused.push(source.Modules[i]);
        w += 1;
      }
    }
  }
  if (unused.length == 0) {
    console.log("%c--- None. All Modules were used in this file.", "color: " + green);
  } else {
    console.log("%c--- There are some...", "color: " + red);
    console.log(unused);
  }

  finishSequence(w, 2);
  return w;
}


function finishSequence(w, spaces = 1, additionalString = "") {
  if (w != 0) {
    console.log("%cWarnings: " + w, "color: " + yellow);
  } else {
    console.log("No Warnings");
  }
  console.log("Finished. " + additionalString);
  for (let i = 0; i < spaces; i++) {
    if (i % 2 == 0) {
      console.log("");
    } else {
      console.log(" ");
    }
  }
}
