const IMG_FOLDER = "img/";
const XLSX_PATH = "stimuli.xlsx";

const COL_NAME = "Slide Name";
const COL_ANSWER = "Correct Answer";
const COL_DIFFICULTY = "Difficulty";
const COL_RANK = "Difficulty Rank";
const COL_ITEMS = "# individual items in slide";

const KEY_SAFE = "s";
const KEY_DANGER = "d";
const BLOCK_SIZE = 10;

async function loadStimuli() {
  const response = await fetch(XLSX_PATH);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  return rows.map((row) => ({
    name: row[COL_NAME],
    src: IMG_FOLDER + row[COL_NAME] + ".jpg",
    correct: row[COL_ANSWER],
    difficulty: row[COL_DIFFICULTY],
    rank: row[COL_RANK],
    items: row[COL_ITEMS],
  }));
}

async function runExperiment() {
  const stimuli = await loadStimuli();
  const jsPsych = initJsPsych({});

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
    choices: "ALL_KEYS",
  };

  // ── between images ─────────────────────────────────
  const ITI_1 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p class="fixation">Baggage incoming</p>',
    choices: "NO_KEYS",
    trial_duration: 4000,
  };

  const ITI_2 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus:
      '<div class="ai-loader"><div class="ai-bars"></div>  <div class="ai-text-static">AI ANALYZING</div></div>',
    choices: "NO_KEYS",
    trial_duration: 4000,
  };

  const ITI_3 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus:
      '<div class="ai-loader">  <div class="ai-bars"></div>  <div class="ai-cycle">    <span>Loading image…</span>    <span>Detecting objects…</span>  <span>Comparing with database…</span>  </div></div>',
    choices: "NO_KEYS",
    trial_duration: 500,
  };

  // ── IMAGE TRIALS ──────────────────────────────
  const shuffled = jsPsych.randomization.shuffle(stimuli);
  const trials = shuffled.map((item) => ({
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
    },
    on_finish: function (data) {
      const responded_danger = data.response === KEY_DANGER;
      const is_search = item.correct === "Search";
      data.correct = responded_danger === is_search ? 1 : 0;
    },
  }));

  // ── BLOCK FEEDBACK ────────────────────────────
  function makeFeedback() {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: function () {
        const allData = jsPsych.data
          .get()
          .filter({ trial_type: "image-keyboard-response" });
        const blockData = allData.values().slice(-BLOCK_SIZE);
        const correct = blockData.filter((t) => t.correct === 1).length;
        return `
              <div style="font-family:sans-serif; text-align:center; margin-top:100px;">
                <h2>Block Feedback</h2>
                <p style="font-size:3em; font-weight:bold; margin-top:20px;">${correct} / 10</p>
                <p><em>Press any key to continue.</em></p>
              </div>`;
      },
      choices: "ALL_KEYS",
    };
  }

  // ── TIMELINE ────────────────────────────
  const timeline = [welcome];
  trials.forEach((trial, index) => {
    timeline.push(ITI_3);
    timeline.push(trial);

    const position = index + 1;
    const isBlockEnd = position % BLOCK_SIZE === 0;
    const isLastTrial = position === trials.length;

    if (isBlockEnd && !isLastTrial) {
      timeline.push(makeFeedback());
    }
  });

  jsPsych.run(timeline);
}

runExperiment();
