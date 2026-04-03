const IMG_FOLDER = "img/";
const IMG_FOLDER_TRANSPARENT = "img_transparent/";
const IMG_ERROR_SIMPLEAI = "img_error_simpleAI/";
const IMG_ERROR_TRANSPARENTAI = "img_error_transparentAI/";
const XLSX_PATH = "stimuli.xlsx";
const XLSX_PATH_TRANSPARENT = "error_transparentAI.xlsx";
const XLSX_PATH_SIMPLE = "error_simpleAI.xlsx";

const COL_NAME = "Slide Name";
const COL_ANSWER = "Correct Answer";
const COL_DIFFICULTY = "Difficulty";
const COL_RANK = "Difficulty Rank";
const COL_ITEMS = "# individual items in slide";
const COL_AI_SUGGESTION = "AI Suggestion";

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
    ai_answer: row[COL_AI_SUGGESTION],
  }));
}

async function loadStimuli_transparent() {
  const response = await fetch(XLSX_PATH);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  return rows.map((row) => ({
    name: row[COL_NAME],
    src: IMG_FOLDER_TRANSPARENT + row[COL_NAME] + ".jpg",
    correct: row[COL_ANSWER],
    difficulty: row[COL_DIFFICULTY],
    rank: row[COL_RANK],
    items: row[COL_ITEMS],
    ai_answer: row[COL_AI_SUGGESTION],
  }));
}

async function loadStimuli_error_simpleAI() {
  const response = await fetch(XLSX_PATH_SIMPLE);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  return rows.map((row) => ({
    name: row[COL_NAME],
    src: IMG_ERROR_SIMPLEAI + row[COL_NAME] + ".jpg",
    correct: row[COL_ANSWER],
    difficulty: row[COL_DIFFICULTY],
    rank: row[COL_RANK],
    items: row[COL_ITEMS],
    ai_answer: row[COL_AI_SUGGESTION],
  }));
}

async function loadStimuli_error_transparentAI() {
  const response = await fetch(XLSX_PATH_TRANSPARENT);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  return rows.map((row) => ({
    name: row[COL_NAME],
    src: IMG_ERROR_TRANSPARENTAI + row[COL_NAME] + ".jpg",
    correct: row[COL_ANSWER],
    difficulty: row[COL_DIFFICULTY],
    rank: row[COL_RANK],
    items: row[COL_ITEMS],
    ai_answer: row[COL_AI_SUGGESTION],
  }));
}

async function runExperiment() {
  const stimuli = await loadStimuli();
  const stimuli_transparent = await loadStimuli_transparent();
  const errorStimuli_simple = await loadStimuli_error_simpleAI();
  const errorStimuli_transparent = await loadStimuli_error_transparentAI();
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
  const ITI_V1 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus:
      '<p class="fixation">BAGGAGE INCOMING</p>',
    choices: "NO_KEYS",
    trial_duration: 3000,
  };

  const ITI_V2 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus:
      '<p class="fixation">BAGGAGE INCOMING</p>',
    choices: "NO_KEYS",
    trial_duration: 1000,
  };

  const ITI_2 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus:
      '<div class="ai-loader"><div class="ai-bars"></div>  <div class="ai-text-static">AI ANALYZING</div></div>',
    choices: "NO_KEYS",
    trial_duration: 2000,
  };

  const ITI_3 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus:
      '<div class="ai-loader">  <div class="ai-bars"></div>  <div class="ai-cycle">    <span>Loading image…</span>    <span>Detecting objects…</span>  <span>Comparing with database…</span>  </div></div>',
    choices: "NO_KEYS",
    trial_duration: 2000,
  };

  /* -------------------------------------------------------------------------- */
  /*                               Error Handling                               */
  /* -------------------------------------------------------------------------- */
  /* Between trial 40 and 50 there will be a system failure which means that there 
will be false positives and false negatives. I have to fully control the content
for the 10 trials*/

  const isErrorTrial = (trialIndex) => trialIndex >= 130 && trialIndex <= 139;

  itemChangesSimpleAI = (trialIndex, item) => {
    if (isErrorTrial(trialIndex)) {
      return errorStimuli_simple[trialIndex - 130];
    }
    return item;
  };

  itemChangesTransparentAI = (trialIndex, item) => {
    if (isErrorTrial(trialIndex)) {
      return errorStimuli_transparent[trialIndex - 130];
    }
    return item;
  };

  /* -------------------------------------------------------------------------- */
  /*                                Image Trials                                */
  /* -------------------------------------------------------------------------- */

  const shuffled = jsPsych.randomization.shuffle(stimuli);
  const trials = shuffled.map((item) => ({
    type: jsPsychImageKeyboardResponse,
    stimulus: item.src,
    choices: [KEY_SAFE, KEY_DANGER],
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
      const correctIsDanger = correctAnswer.startsWith("d");
      data.correct =
        data.response === null
          ? 0
          : responded_danger === correctIsDanger
            ? 1
            : 0;
    },
    trial_duration: 5000,
  }));
  /* -------------------------- Simple AI Image trial ------------------------- */

  const trials_simpleAI = shuffled.map((item, index) => {
    const modifiedItem = itemChangesSimpleAI(index, item);
    console.log("Trial " + index + ": " + modifiedItem.name + " - AI suggests: " + modifiedItem.ai_answer);
    return {
      type: jsPsychImageKeyboardResponse,
      stimulus: modifiedItem.src,
      choices: [KEY_SAFE, KEY_DANGER],
      prompt: `<p class="ai_answer" data-suggestion="${modifiedItem.ai_answer}">AI suggests: ${modifiedItem.ai_answer}</p>`,
      data: {
        slide_name: modifiedItem.name,
        correct_answer: modifiedItem.correct,
        ai_answer: modifiedItem.ai_answer,
        difficulty: modifiedItem.difficulty,
        rank: modifiedItem.rank,
        items: modifiedItem.items,
      },
      on_finish: function (data) {
        const responded_danger = data.response === KEY_DANGER;
        const correctAnswer = String(modifiedItem.correct).trim().toLowerCase();
        const correctIsDanger = correctAnswer.startsWith("d");
        data.correct =
          data.response === null
            ? 0
            : responded_danger === correctIsDanger
              ? 1
              : 0;
        data.ai_answer = modifiedItem.ai_answer;
      },
      trial_duration: 5000,
    };
  });

  /* ----------------------- Transparent AI Image trial ----------------------- */

  /* This is the most complex AI image trial, it includes the previous loading, 
the AI suggestion and also the position indicator if there's a target and the
certainty indicator which is calculated based on the image difficulty. I belive
multiple functions are needed */

  const shuffled_transparent =
    jsPsych.randomization.shuffle(stimuli_transparent);

  const calculateCertainty = (difficulty) => {
    /* The difficulty ranges between 0.04 to 0.80. The AI certainty lowest certainty
    is 75 so it needs to be adjusted */
    const certainty = Math.max(75, 100 - (difficulty / 0.8) * 25);
    return Math.round(certainty);
  };

  const trials_transparentAI = shuffled_transparent.map((item, index) => {
    const modifiedItem = itemChangesTransparentAI(index, item);
    const certainty = calculateCertainty(item.difficulty);
    console.log("Trial " + index + ": " + modifiedItem.name + " - AI suggests: " + modifiedItem.ai_answer);

    return {
      type: jsPsychImageKeyboardResponse,
      stimulus: modifiedItem.src,
      choices: [KEY_SAFE, KEY_DANGER],
      prompt: `
        <div class="ai-feedback" >
          <p class="ai_answer" data-suggestion="${modifiedItem.ai_answer}">AI suggests: ${modifiedItem.ai_answer}</p>
          <div class="ai_certainty_wrapper">
            <div class="ai_certainty_label">Certainty: ${certainty}%</div>
            <div class="ai_certainty_bar">
              <div class="ai_certainty_fill" style="width: ${certainty}%;"></div>
            </div>
          </div>
        </div>`,
      data: {
        slide_name: modifiedItem.name,
        correct_answer: modifiedItem.correct,
        ai_answer: modifiedItem.ai_answer,
        difficulty: modifiedItem.difficulty,
        rank: modifiedItem.rank,
        items: modifiedItem.items,
      },
      on_finish: function (data) {
        const responded_danger = data.response === KEY_DANGER;
        const correctAnswer = String(modifiedItem.correct).trim().toLowerCase();
        const correctIsDanger = correctAnswer.startsWith("d");
        data.correct =
          data.response === null
            ? 0
            : responded_danger === correctIsDanger
              ? 1
              : 0;
        data.ai_answer = modifiedItem.ai_answer;
        data.ai_certainty = certainty;
      },
      trial_duration: 5000,
    };
  });

  /* -------------------------------------------------------------------------- */
  /*                                  Feedback                                  */
  /* -------------------------------------------------------------------------- */

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

  /* --------------------- Display of participants awnser --------------------- */
  function displayAnswer() {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: function () {
        const last = jsPsych.data
          .get()
          .filter({ trial_type: "image-keyboard-response" })
          .values()
          .slice(-1)[0];
        const response = last.response;
        const label =
          response === KEY_SAFE
            ? "Safe"
            : response === KEY_DANGER
              ? "Danger"
              : "No response";
        return `
            <div class="response-container">
            <p class="response-label">Your answer:</p>
              <p class="response">${label}</p>
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

  function training() {
    for (let i = 0; i < 30; i++) {
      timeline.push(ITI_V1);
      timeline.push(trials[i]);
      timeline.push(displayAnswer());
      timeline.push(feedbackPerTrial());

      const position = i + 1;
      const isBlockEnd = position % BLOCK_SIZE === 0;
      const isLastTrial = position === 30;

      if (isBlockEnd && !isLastTrial) {
        timeline.push(feedback10trials());
      }
    }
    timeline.push(feedback10trials());
    const blockComplete = {
      type: jsPsychCallFunction,
      func: () => {
        console.log("Block 1 completed");
      },
    };
    timeline.push(blockComplete);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Block No-AI                                */
  /* -------------------------------------------------------------------------- */
  /* In this block, participants will not receive any feedback after each trial, 
but they will receive a feedback every 10 trials, indicating the number of 
correct responses in the last 10 trials. It will also be just 30 trials long. 
There will be no AI assistance in this block. So the ITI will be n1.*/

  function block_noAI() {
    const screen_NoAI = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
      <div>
        <h1>Block No-AI</h1>
        <p><em>Press any key to begin.</em></p>
      </div>`,
      choices: "ALL_KEYS",
    };
    timeline.push(screen_NoAI);
    for (let i = 30; i < 90; i++) {
      timeline.push(ITI_V1);
      timeline.push(trials[i]);
      timeline.push(displayAnswer());

      const position = i - 30 + 1;
      const isBlockEnd = position % BLOCK_SIZE === 0;
      const isLastTrial = position === 60;

      if (isBlockEnd && !isLastTrial) {
        timeline.push(feedback10trials());
      }
    }
    timeline.push(feedback10trials());
  }

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
  function block_simpleAI() {
    const screen_NoAI = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
      <div>
        <h1>Block Simple AI</h1>
        <p><em>Press any key to begin.</em></p>
      </div>`,
      choices: "ALL_KEYS",
    };
    timeline.push(screen_NoAI);
    for (let i = 90; i < 150; i++) {
      timeline.push(ITI_V2);
      timeline.push(ITI_2);
      timeline.push(trials_simpleAI[i]);
      timeline.push(displayAnswer());

      const position = i - 90 + 1;
      const isBlockEnd = position % BLOCK_SIZE === 0;
      const isLastTrial = position === 60;

      if (isBlockEnd && !isLastTrial) {
        timeline.push(feedback10trials());
      }
    }
    timeline.push(feedback10trials());
  }

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

  function block_transparentAI() {
    // To be implemented in the future
    const screen_TransparentAI = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
      <div>
        <h1>Block Transparent AI</h1>
        <p><em>Press any key to begin.</em></p>
      </div>`,
      choices: "ALL_KEYS",
    };
    timeline.push(screen_TransparentAI);
    for (let i = 90; i < 150; i++) {
      timeline.push(ITI_V2);
      timeline.push(ITI_3);
      timeline.push(trials_transparentAI[i]);
      timeline.push(displayAnswer());
      const position = i - 90 + 1;
      const isBlockEnd = position % BLOCK_SIZE === 0;
      const isLastTrial = position === 60;

      if (isBlockEnd && !isLastTrial) {
        timeline.push(feedback10trials());
      }
    }
    timeline.push(feedback10trials());
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Timeline                                  */
  /* -------------------------------------------------------------------------- */
  const endScreen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
    <div>
      <h1>Thank You!</h1>
      <p>The experiment has been completed.</p>
      <p>Your data is being saved...</p>
    </div>`,
    choices: "NO_KEYS",
    trial_duration: 2000,
    on_finish: function () {
      const csv = jsPsych.data
        .get()
        .filter({ trial_type: "image-keyboard-response" })
        .csv();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      link.download = `experiment_data_${new Date().toISOString()}.csv`;
      link.click();
    },
  };

  const timeline = [welcome];
  block_simpleAI();
  timeline.push(endScreen);
  jsPsych.run(timeline);
}

runExperiment();
