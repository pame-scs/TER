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

  /* ----------------------------- Welcome Screen ----------------------------- */
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

  /* --------------------------- Inter-trial interval ------------------------- */
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
    trial_duration: 4000,
  };

  /* ------------------------------ Image trials ------------------------------ */
  const shuffled = jsPsych.randomization.shuffle(stimuli);
  const trials = shuffled.map((item) => ({
    type: jsPsychImageKeyboardResponse,
    stimulus: item.src,
    choices: [KEY_SAFE, KEY_DANGER],
    prompt: `<p class="prompt">
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
      const correctAnswer = String(item.correct).trim().toLowerCase();
      const correctIsDanger = correctAnswer.startsWith("d"); // Danger / danger / D
      data.correct = responded_danger === correctIsDanger ? 1 : 0;
    },
  }));

  /* ------------------------ Feebback after each trial ----------------------- */
  function feedbackPerTrial() {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: function () {
        const last = jsPsych.data
          .get()
          .filter({ trial_type: "image-keyboard-response" })
          .values()
          .slice(-1)[0];
        const correct = last.correct == 1 || last.correct === true;
        const label = correct ? "Correct" : "Incorrect";
        return `
              <div style="font-family:sans-serif; text-align:center;">
                <p class=${label.toLowerCase()}>${label}</p>
              </div>`;
      },
      choices: "NO_KEYS",
      trial_duration: 1000,
    };
  }
  /* ------------------------ Feedback every 10 trials ------------------------ */
  function feedback10trials() {
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

  /* -------------------------------------------------------------------------- */
  /*                                   Block 1                                  */
  /* -------------------------------------------------------------------------- */
  /* In this block, participants will see an inmediate feedback after each trial, 
indicating whether their response was correct or not. It will also show a 
feedback every 10 trials, indicating the number of correct responses in the 
last 10 trials. It will also be just 30 trials long. There will be no 
AI assistance in this block. So the ITI will be n1.
*/

  /* -------------------------------------------------------------------------- */
  /*                                 Block No-AI                                */
  /* -------------------------------------------------------------------------- */
  /* In this block, participants will not receive any feedback after each trial, 
but they will receive a feedback every 10 trials, indicating the number of 
correct responses in the last 10 trials. It will be just 60 trials long. 
There will be no AI assistance in this block. So the ITI will be n1.*/

  /* -------------------------------------------------------------------------- */
  /*                               Block Simple AI                              */
  /* -------------------------------------------------------------------------- */
  /* In this block, participants will not receive any feedback after each trial, 
but they will receive a feedback every 10 trials, indicating the number of 
correct responses in the last 10 trials. It will be just 60 trials long. 
There will be a simple AI in this block. For trial 1 to 40 the AI will be 100%
accurate, for trial 41 to 50 the AI will fail 6 consecutive times. 3 false 
negatives and 3 false positives. For trial 51 to 60 the AI will be 100% accurate,
So the ITI will be n2.
*/

  /* -------------------------------------------------------------------------- */
  /*                            Block Transparent AI                            */
  /* -------------------------------------------------------------------------- */
  /* In this block, participants will not receive any feedback after each trial, 
but they will receive a feedback every 10 trials, indicating the number of 
correct responses in the last 10 trials. It will be just 60 trials long. 
There will be a transparent AI in this block. For trial 1 to 40 the AI will be 100%
accurate, for trial 41 to 50 the AI will fail 6 consecutive times. 3 false 
negatives and 3 false positives. For trial 51 to 60 the AI will be 100% accurate. 
The AI output will be a binary signal (Safe or Danger), also the level of 
confidence (0-100%) and a square indicating the area of the image that 
the AI considered more relevant for its decision. So the ITI will be n3.
*/

  /* -------------------------------------------------------------------------- */
  /*                                  Timeline                                  */
  /* -------------------------------------------------------------------------- */
  const timeline = [welcome];
  trials.forEach((trial, index) => {
    timeline.push(ITI_3);
    timeline.push(trial);
    timeline.push(feedbackPerTrial());

    const position = index + 1;
    const isBlockEnd = position % BLOCK_SIZE === 0;
    const isLastTrial = position === trials.length;

    if (isBlockEnd && !isLastTrial) {
      timeline.push(feedback10trials());
    }
  });

  jsPsych.run(timeline);
}

runExperiment();
