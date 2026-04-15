/**
 * jsPsych plugin for pavlovia.org
 * Updated for jsPsych 8.x
 */

class jsPsychPavloviaPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
    this.config = {};
    this.sessionToken = null;
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
      }
    },
    data: {
      pavlovia_command: {
        type: 'string'
      }
    }
  };

  async trial(display_element, trial) {
    if (trial.command.toLowerCase() === 'init') {
      await this.init();
      this.jsPsych.finishTrial({
        pavlovia_command: 'init'
      });
    } else if (trial.command.toLowerCase() === 'finish') {
      const data = this.jsPsych.data.get().csv();
      await this.finish(data);
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

  async init() {
    try {
      console.log('[pavlovia] Initializing session...');
      
      // Get experiment path from URL
      const pathParts = window.location.pathname.split('/');
      const experimentPath = pathParts.slice(-2).join('/');
      
      // Get pilot token if present
      const urlParams = new URLSearchParams(window.location.search);
      const pilotToken = urlParams.get('__pilotToken');
      
      // Open session with Pavlovia
      const response = await fetch(
        `https://pavlovia.org/api/v2/experiments/${encodeURIComponent(experimentPath)}/sessions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            pilotToken ? { pilotToken } : {}
          )
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.sessionToken = data.token;
        console.log('[pavlovia] Session opened with token:', this.sessionToken);
      } else {
        console.warn('[pavlovia] Failed to open session:', response.status);
      }
    } catch (error) {
      console.error('[pavlovia] Error initializing:', error);
    }
  }

  async finish(data) {
    try {
      console.log('[pavlovia] Finishing experiment and saving data...');
      
      if (!this.sessionToken) {
        console.warn('[pavlovia] No session token, attempting local fallback');
        this.downloadDataLocally(data);
        return;
      }

      const pathParts = window.location.pathname.split('/');
      const experimentPath = pathParts.slice(-2).join('/');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}.csv`;

      // Upload data to Pavlovia
      const response = await fetch(
        `https://pavlovia.org/api/v2/experiments/${encodeURIComponent(experimentPath)}/sessions/${this.sessionToken}/results`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key: filename,
            value: data
          })
        }
      );

      if (response.ok) {
        console.log('[pavlovia] Data saved to Pavlovia successfully');
      } else {
        console.warn('[pavlovia] Failed to save data, status:', response.status);
        this.downloadDataLocally(data);
      }

      // Close session
      await fetch(
        `https://pavlovia.org/api/v2/experiments/${encodeURIComponent(experimentPath)}/sessions/${this.sessionToken}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isCompleted: true })
        }
      );

      console.log('[pavlovia] Session closed');
    } catch (error) {
      console.error('[pavlovia] Error finishing:', error);
      this.downloadDataLocally(data);
    }
  }

  downloadDataLocally(data) {
    const filename = 'experiment_data_' + new Date().toISOString() + '.csv';
    const blob = new Blob([data], { type: 'text/csv' });

    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);

    console.log('[pavlovia] Data offered for local download');
  }
}

window.jsPsychPavloviaPlugin = jsPsychPavloviaPlugin;