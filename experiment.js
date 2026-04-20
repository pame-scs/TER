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

  const allImages = stimuli
    .concat(stimuli_transparent)
    .concat(errorStimuli_simple)
    .concat(errorStimuli_transparent)
    .map((item) => item.src);

  const preload = {
    type: "preload",
    images: allImages,
  };

  /* ----------------------------- Welcome Screen ----------------------------- */
  const welcome = {
    type: "html-keyboard-response",
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
    choices: jsPsych.ALL_KEYS,
  };

  /* --------------------------- Inter-trial interval ------------------------- */
  const ITI_V1 = {
    type: "html-keyboard-response",
    stimulus: '<div class="baggage"><div>Baggage incoming</div></div>',
    choices: jsPsych.NO_KEYS,
    trial_duration: 4000,
  };

  const ITI_2 = {
    type: "html-keyboard-response",
    stimulus:
      '<div class="baggage">Baggage incoming</div> <div class="ai-pipeline"><div>AI is processing</div></div>',
    choices: jsPsych.NO_KEYS,
    trial_duration: 4000,
  };

  const ITI_3 = {
    type: "html-keyboard-response",
    stimulus:
      '<div class="baggage">Baggage incoming</div> <div class="ai-pipeline"><div>Initializing runtime environment</div>  <div>Loading image</div>  <div>Searching database</div>  <div>Comparing patterns</div>  <div>Resolving output</div></div>',
    choices: jsPsych.NO_KEYS,
    trial_duration: 4000,
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
    type: "image-keyboard-response",
    stimulus: item.src,
    choices: [KEY_SAFE, KEY_DANGER],
    data: {
      task: "standard_trial",
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

    return {
      type: "image-keyboard-response",
      stimulus: modifiedItem.src,
      choices: [KEY_SAFE, KEY_DANGER],
      prompt: `<div class="ai-feedback"><div class="ai_suggestion_wrapper">
          <p>AI suggests:</p>
          <p class="ai_answer" data-suggestion="${modifiedItem.ai_answer}">
            ${modifiedItem.ai_answer}
          </p>
        </div></div>`,
      data: {
        task: "simple_trial",
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

    return {
      type: "image-keyboard-response",
      stimulus: modifiedItem.src,
      choices: [KEY_SAFE, KEY_DANGER],
      prompt: `<div class="ai-feedback">
        
        <div class="ai_certainty_wrapper">
          <div class="ai_certainty_label">
        Certainty: [${
          "█".repeat(Math.round((certainty / 100) * 35)) +
          "░".repeat(35 - Math.round((certainty / 100) * 35))
        }] ${certainty}
      </div>
        </div>
        <div class="ai_suggestion_wrapper">
          <p>AI suggests:</p>
          <p class="ai_answer" data-suggestion="${modifiedItem.ai_answer}">
            ${modifiedItem.ai_answer}
          </p>
        </div>
      </div>`,
      data: {
        task: "transparent_trial",
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
      type: "html-keyboard-response",
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
      choices: jsPsych.NO_KEYS,
      trial_duration: 1000,
    };
  }

  /* --------------------- Display of participants awnser --------------------- */
  function displayAnswer() {
    return {
      type: "html-keyboard-response",
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
      choices: jsPsych.NO_KEYS,
      trial_duration: 1000,
    };
  }

  /* ------------------------ Feedback every 10 trials ------------------------ */
  function feedback10trials() {
    return {
      type: "html-keyboard-response",
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
      choices: jsPsych.ALL_KEYS,
    };
  }

  /* ------------------------------- Total count ------------------------------ */

  function totalcountFeedback(taskType, totalTrials) {
    return {
      type: "html-keyboard-response",
      stimulus: function () {
        const allData = jsPsych.data.get().filter({ task: taskType });
        const correct = allData.values().filter((t) => t.correct === 1).length;
        const total = totalTrials;
        return `
              <div style="font-family:sans-serif; text-align:center; margin-top:100px;">
                <h2>Total Performance</h2>
                <p style="font-size:3em; font-weight:bold; margin-top:20px;">${correct} / ${total}</p>
                <p><em>Press any key to continue.</em></p>
              </div>`;
      },
      choices: jsPsych.ALL_KEYS,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                          Contingencies Conditions                          */
  /* -------------------------------------------------------------------------- */
  /* ------------------------ Neutral - Gain condition ------------------------ */
  /* In this condition, if the participant responds correctly, they receive 1€ and 
  if they respond incorrectly, they receive nothing. The feedback will indicate 
  the amount of money won every 10 trials. */

  function feedback10trials_gain() {
    return {
      type: "html-keyboard-response",
      stimulus: function () {
        const allData = jsPsych.data
          .get()
          .filter({ trial_type: "image-keyboard-response" });
        const blockData = allData.values().slice(-BLOCK_SIZE);
        const correct = blockData.filter((t) => t.correct === 1).length;
        const moneyWon = correct * 1; // 1€ per correct response
        return `
              <div style="font-family:sans-serif; text-align:center; margin-top:100px;">
                <h2>Block Feedback</h2>
                <p>You won ${moneyWon}€ in this block!</p>
                <p><em>Press any key to continue.</em></p>
              </div>`;
      },
      choices: jsPsych.ALL_KEYS,
    };
  }

  function feedbackEND_gain() {
    return {
      type: "html-keyboard-response",
      stimulus: function () {
        const allData = jsPsych.data
          .get()
          .filter({ trial_type: "image-keyboard-response" });
        const correct = allData.values().filter((t) => t.correct === 1).length;
        const moneyWon = correct * 1; // 1€ per correct response
        return `
              <div style="font-family:sans-serif; text-align:center; margin-top:100px;">
                <h2>Total Performance</h2>
                <p>You won ${moneyWon}€ in total!</p>
                <p><em>Press any key to continue.</em></p>
              </div>`;
      },
      choices: jsPsych.ALL_KEYS,
    };
  }

  /* ------------------------ Neutral - Loss condition ------------------------ */
  /* In this condition, if the participant responds correctly, they receive 1€ and 
  if they respond incorrectly, they lose 1€. The feedback will indicate the amount 
  of money gained every 10 trials. */
  function feedback10trials_loss() {
    return {
      type: "html-keyboard-response",
      stimulus: function () {
        const allData = jsPsych.data
          .get()
          .filter({ trial_type: "image-keyboard-response" });
        const blockData = allData.values().slice(-BLOCK_SIZE);
        const correct = blockData.filter((t) => t.correct === 1).length;
        const moneyWon = correct * 1; // 1€ per correct response
        const moneyLost = (BLOCK_SIZE - correct) * 1; // 1€ lost per incorrect response
        const netEarnings = moneyWon - moneyLost;
        return `
              <div style="font-family:sans-serif; text-align:center; margin-top:100px;">
                <h2>Block Feedback</h2>
                <p>You won ${moneyWon}€ and lost ${moneyLost}€ in this block! Your net earnings are ${netEarnings}€.</p>
                <p><em>Press any key to continue.</em></p>
              </div>`;
      },
      choices: jsPsych.ALL_KEYS,
    };
  }

  function feedbackEND_loss() {
    return {
      type: "html-keyboard-response",
      stimulus: function () {
        const allData = jsPsych.data
          .get()
          .filter({ trial_type: "image-keyboard-response" });
        const correct = allData.values().filter((t) => t.correct === 1).length;
        const total = allData.count();
        const moneyWon = correct * 1; // 1€ per correct response
        const moneyLost = (total - correct) * 1; // 1€ lost per incorrect response
        const netEarnings = moneyWon - moneyLost;
        return `
              <div style="font-family:sans-serif; text-align:center; margin-top:100px;">
                <h2>Total Performance</h2>
                <p>You won ${moneyWon}€ and lost ${moneyLost}€ in total! Your net earnings are ${netEarnings}€.</p>
                <p><em>Press any key to continue.</em></p>
              </div>`;
      },
      choices: jsPsych.ALL_KEYS,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Assesments                                 */
  /* -------------------------------------------------------------------------- */
  /* ---------------------- Questionaire every 10 trials ---------------------- */
  function questionnaire() {
    return {
      type: "survey-html-form",
      html: `
      <div class="tlx-question">
        <p><b>How confident are you in your responses?</b></p>
        <div class="tlx-slider-row">
          <span>Not confident</span>
          <input type="range" name="confidence" min="0" max="100" step="10" value="50" class="tlx-slider">
          <span>Very confident</span>
        </div>
      </div>

      <div class="tlx-question">
        <p><b>Do you trust AI?</b></p>
        <div class="tlx-slider-row">
          <span>Do not trust</span>
          <input type="range" name="trust" min="0" max="100" step="10" value="50" class="tlx-slider">
          <span>Trust completely</span>
        </div>
      </div>
    `,on_finish: function (data) {
      const r = data.response;
      data.confidence = parseInt(r.confidence);
      data.trust = parseInt(r.trust);
    },
      data: {
        task: "questionnaire",
      },
    };
  }

  /* -------------------------------- NASA LTX -------------------------------- */
  function nasaTLX() {
    const questions = [
      {
        name: "mental_demand",
        prompt: "How mentally demanding was this block?",
        low: "Low",
        high: "High",
        reversed: false,
      },
      {
        name: "physical_demand",
        prompt: "How physically demanding was this block?",
        low: "Low",
        high: "High",
        reversed: false,
      },
      {
        name: "temporal_demand",
        prompt: "How hurried or rushed was the pace of this block?",
        low: "Low",
        high: "High",
        reversed: false,
      },
      {
        name: "performance",
        prompt:
          "How successful were you in accomplishing what you were asked to do?",
        low: "Good",
        high: "Poor",
        reversed: true,
      },
      {
        name: "effort",
        prompt:
          "How hard did you have to work to accomplish your level of performance?",
        low: "Low",
        high: "High",
        reversed: false,
      },
      {
        name: "frustration",
        prompt:
          "How insecure, discouraged, irritated, stressed, and annoyed were you?",
        low: "Low",
        high: "High",
        reversed: false,
      },
    ];

    const questionsHTML = questions
      .map(
        ({ name, prompt, low, high }) => `
    <div class="tlx-question">
      <p><b>${prompt}</b></p>
      <div class="tlx-slider-row">
        <span>${low}</span>
        <input type="range" name="${name}" min="0" max="100" step="10" value="50" class="tlx-slider">
        <span>${high}</span>
      </div>
    </div>
  `,
      )
      .join("");

    return {
      type: "survey-html-form",
      html: questionsHTML,
      on_finish: function (data) {
        const r = data.response;
        if (r.performance !== undefined) {
          r.performance = String(100 - parseInt(r.performance));
        }
        data.response = r;
      },
      on_finish: function (data) {
        const r = data.response;

        if (r.performance !== undefined) {
          r.performance = 10 - parseInt(r.performance);
        }

        data.mental_demand = parseInt(r.mental_demand);
        data.physical_demand = parseInt(r.physical_demand);
        data.temporal_demand = parseInt(r.temporal_demand);
        data.performance = parseInt(r.performance);
        data.effort = parseInt(r.effort);
        data.frustration = parseInt(r.frustration);
      },
      data: {
        task: "nasa_tlx",
      },
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
    timeline.push(totalcountFeedback("standard_trial", 30));
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
      type: "html-keyboard-response",
      stimulus: `
      <div>
        <h1>Block No-AI</h1>
        <p><em>Press any key to begin.</em></p>
      </div>`,
      choices: jsPsych.ALL_KEYS,
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
    timeline.push(totalcountFeedback("standard_trial", 60));
    timeline.push(nasaTLX());
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
      type: "html-keyboard-response",
      stimulus: `
      <div>
        <h1>Block Simple AI</h1>
        <p><em>Press any key to begin.</em></p>
      </div>`,
      choices: jsPsych.ALL_KEYS,
    };
    timeline.push(screen_NoAI);
    for (let i = 90; i < 150; i++) {
      timeline.push(ITI_2);
      timeline.push(trials_simpleAI[i]);
      timeline.push(displayAnswer());

      const position = i - 90 + 1;
      const isBlockEnd = position % BLOCK_SIZE === 0;
      const isLastTrial = position === 60;

      if (isBlockEnd && !isLastTrial) {
        timeline.push(questionnaire());
        timeline.push(feedback10trials_loss());
        timeline.push(feedback10trials());
        timeline.push(questionnaire());
      }
    }
    timeline.push(feedback10trials_loss());
    timeline.push(questionnaire());
    timeline.push(feedback10trials());
    timeline.push(questionnaire());
    timeline.push(feedbackEND_loss());
    timeline.push(totalcountFeedback("simple_trial", 60));
    timeline.push(nasaTLX());
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
    const screen_TransparentAI = {
      type: "html-keyboard-response",
      stimulus: `
      <div>
        <h1>Block Transparent AI</h1>
        <p><em>Press any key to begin.</em></p>
      </div>`,
      choices: jsPsych.ALL_KEYS,
    };
    timeline.push(screen_TransparentAI);
    for (let i = 90; i < 150; i++) {
      timeline.push(ITI_3);
      timeline.push(trials_transparentAI[i]);
      timeline.push(displayAnswer());
      const position = i - 90 + 1;
      const isBlockEnd = position % BLOCK_SIZE === 0;
      const isLastTrial = position === 60;

      if (isBlockEnd && !isLastTrial) {
        timeline.push(questionnaire());
        timeline.push(feedback10trials());
        timeline.push(questionnaire());
      }
    }
    timeline.push(questionnaire());
    timeline.push(feedback10trials());
    timeline.push(questionnaire());
    timeline.push(totalcountFeedback("transparent_trial", 60));
    timeline.push(nasaTLX());
  }

  /* ------------------------- pavlovia initilization ------------------------- */
  const pavlovia_init = {
    type: "pavlovia",
    command: "init",
  };

  /* ------------------------------- end screen ------------------------------- */
  const endScreen = {
    type: "html-keyboard-response",
    stimulus: `
    <div>
      <h1>Thank You!</h1>
      <p>The experiment has been completed.</p>
      <p>Your data is being saved...</p>
    </div>`,
    choices: jsPsych.NO_KEYS,
    trial_duration: 2000,
  };

  /* ----------------------------- pavlovia finish ---------------------------- */
  const pavlovia_finish = {
    type: "pavlovia",
    command: "finish",
    participantId: "PARTICIPANT",
  };

  /* -------------------------------------------------------------------------- */
  /*                                  Timeline                                  */
  /* -------------------------------------------------------------------------- */
  const timeline = [pavlovia_init, preload, welcome];
  block_transparentAI();
  timeline.push(endScreen);
  timeline.push(pavlovia_finish);

  jsPsych.init({
    timeline: timeline,
    on_finish: function (data) {
      jsPsych.data.displayData();
    },
  });
}

runExperiment();
