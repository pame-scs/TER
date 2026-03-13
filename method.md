### Experimental Structure
The experiment consists of **four blocks**:
1. **Block 1 (Practice)** - ==30 trials== - Instant feedback is provided after each trial. No AI assistance is provided.
2. **Blocks 2-4 (Experimental)** - ==60 trials== - Randomized order among three conditions:
    - **Block A:** No AI assistance
    - **Block B:** Simple AI assistance
    - **Block C:** Transparent AI assistance
	After every 10 trials, participants receive cumulative feedback on their performance (number of correct responses out of ten) ==and complete self-assessment scales==
### Participant Groups
Participants are divided into two groups based on compensation scheme:
- **Group 1:** Receives compensation for correct responses; no penalty for incorrect responses.
- **Group 2:** Receives compensation for correct responses; incurs a loss for incorrect responses.

### Trial Procedure
Each trial follows the sequence below:
1. **Inter-trial interval (ITI):** A screen displayed for 4000 ms ==(or between 3000–5000 ms?)==. The message depends on the block:
    - **Block 1 & Block A:** "Baggage incoming"
    - **Block B:** =="Baggage incoming"== + "AI is analyzing"
    - **Block C:** =="Baggage incoming"== + "AI processing: loading, comparing to database, calculating certainty"
2. **Image presentation:** X-ray image from Merritt et al. (2019) is shown ([dataset](https://irl.umsl.edu/psychology-faculty/61/)).
    - Images vary in difficulty (Classical Test Theory index): hardest = 80%, easiest = 4%.
    - Total of 150 images; 30 contain dangerous objects (≈20%).
    - ==Images remain on screen until participant response, with a maximum display of ~5000 ms.==
3. **AI Assistance (if applicable):**
    - **Simple AI (Block B):** AI output displayed simultaneously with the image (e.g., threat / no threat)
    - **Transparent AI (Block C):** Transparency implemented in three ways:
        1. Processing message before the image appears.
        2. Display of AI certainty (derived from image difficulty).
        3. Visual cue indicating AI confidence (location/design to be determined, mindful of attention tunneling).
4. **Participant response:** Participants indicate the presence or absence of a dangerous object.

### Feedback and Scales
==Every 10 trials, participants complete self-assessment measures before receiving their score.==
- **Additional measures:**
	- ==Confidence in their own performance==
	- ==Trust in the AI system (when applicable)==
	- ==Perceived workload==

### AI Reliability Manipulation
- ==**First half of AI trials (30 trials):** AI is 100% accurate.==
- ==**Second half of AI trials:**== 
	- ==10 trials : AI still 100% accurate==
	- ==10 trials: 3 false positives and 3 false negatives==
	- ==10 trials: AI back to 100% accurate==
- ==**To be determined**: corresponding certainty displays and visual cue positioning.==

### Parameters to be Determined
- Number of trials per block.
- Number of dangerous object images per block (likely 20%, consistent with image bank).
- Detailed AI failure implementation (frequency, type of error, certainty display, visual cue placement).
- Error probability structure: e.g., whether errors occur on specific trials or probabilistically for each trial.