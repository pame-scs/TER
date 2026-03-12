const IMG_FOLDER = "img/";
const XLSX_PATH = "stimuli.xlsx";

const COL_NAME = "Slide Name";
const COL_ANSWER = "Correct Answer";  
const COL_DIFFICULTY = "Difficulty";
const COL_RANK = "Difficulty Rank";
const COL_ITEMS = "# individual items in slide";

const KEY_SAFE = "s"; 
const KEY_DANGER = "d"; 

async function loadStimuli() {
  const response = await fetch(XLSX_PATH);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  return rows.map(row => ({
    name:row[COL_NAME],
    src:IMG_FOLDER + row[COL_NAME] + ".jpg",
    correct:row[COL_ANSWER],
    difficulty:row[COL_DIFFICULTY],
    rank:row[COL_RANK],
    items:row[COL_ITEMS],
  }));
}

async function runExperiment() {
  const stimuli = await loadStimuli();
  const jsPsych = initJsPsych({ });

  // ── WELCOME SCREEN ─────────────────────────────
  const welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div>
        <h1>Human-Automation Study</h1>
        <p>You will see a series of luggage X-ray images.</p>
        <p>For each image, decide whether it contains a dangerous object.</p>
        <br>
        <p>Press S : Safe </p>
        <p>Press D : Danger </p>
        <br>
        <p><em>Press any key to begin.</em></p>
      </div>`,
    choices: "ALL_KEYS"
  };

  // ── between images ─────────────────────────────────
  const ITI_1 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p class="fixation">Baggage incoming</p>',
    choices: "NO_KEYS",
    trial_duration: 4000
  };

  const ITI_2 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div class="ai-loader"><div class="ai-bars"></div>  <div class="ai-text-static">AI ANALYZING</div></div>',
    choices: "NO_KEYS",
    trial_duration: 4000
  };

  const ITI_3 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div class="ai-loader">  <div class="ai-bars"></div>  <div class="ai-cycle">    <span>Loading image…</span>    <span>Detecting objects…</span>  <span>Comparing with database…</span>  </div></div>',
    choices: "NO_KEYS",
    trial_duration: 4000
  };

  // ── IMAGE TRIALS ──────────────────────────────
  const shuffled = jsPsych.randomization.shuffle(stimuli);

  const trials = shuffled.map(item => ({
    type: jsPsychImageKeyboardResponse,
    stimulus: item.src,
    choices: [KEY_SAFE, KEY_DANGER],
    prompt: `<p>
               S = Safe | D = Danger
             </p>`,
    data: {
      slide_name: item.name,
      correct_answer: item.correct,
      difficulty: item.difficulty,
      rank: item.rank,
      items: item.items,
    }
  }));

  // ── TIMELINE ────────────────────────────
  const timeline = [welcome];

  trials.forEach((trial, index) => {
    timeline.push(ITI_3);
    timeline.push(trial);
  });

  jsPsych.run(timeline);
}

runExperiment();