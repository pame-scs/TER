/**
 * jsPsych plugin for pavlovia.org
 * 
 * Updated for jsPsych 8.x
 * Handles communications with the pavlovia.org server
 */

class jsPsychPavloviaPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  static info = {
    name: 'pavlovia',
    version: '2.0.0',
    description: 'communication with pavlovia.org',
    parameters: {
      command: {
        type: 'string',
        pretty_name: 'Command',
        default: 'init',
        description: 'The pavlovia command: "init" (default) or "finish"'
      },
      participantId: {
        type: 'string',
        pretty_name: 'Participant Id',
        default: 'PARTICIPANT',
        description: 'The participant Id: "PARTICIPANT" (default) or any string'
      }
    },
    data: {
      pavlovia_command: {
        type: 'string'
      }
    }
  };

  trial(display_element, trial) {
    let self = this;

    if (trial.command.toLowerCase() === 'init') {
      console.log('[pavlovia] Experiment session initialized');
      this.jsPsych.finishTrial({
        pavlovia_command: 'init'
      });
    } else if (trial.command.toLowerCase() === 'finish') {
      console.log('[pavlovia] Experiment session finishing and saving data');
      
      // Get all data
      let data = this.jsPsych.data.get().csv();
      console.log('[pavlovia] Data to save:', data);
      
      // Save the data
      this.saveData(data, trial);
      
      // Finish the trial
      this.jsPsych.finishTrial({
        pavlovia_command: 'finish'
      });
    } else {
      console.error('[pavlovia] Unknown command: ' + trial.command);
      this.jsPsych.finishTrial({
        pavlovia_command: 'error'
      });
    }
  }

  saveData(data, trial) {
    // For now, offer data for download as a fallback
    // When deployed to Pavlovia, this will be handled by Pavlovia's infrastructure
    
    const filename = 'experiment_data_' + new Date().toISOString() + '.csv';
    const blob = new Blob([data], { type: 'text/csv' });

    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, filename);
    } else {
      const elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }

    console.log('[pavlovia] Data offered for download');
  }
}

// Register the plugin for use
window.jsPsychPavloviaPlugin = jsPsychPavloviaPlugin;