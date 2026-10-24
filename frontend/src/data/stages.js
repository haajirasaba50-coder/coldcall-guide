// Validate these illustrative examples against all 100 supplied transcripts before submission.
export const stages = [
  {
    number: 1, name: 'Opening', purpose: 'Reach the right person and say who you are. The first few seconds decide whether this call gets a minute.',
    likelySay: ['“Who is calling, and what is this about?”', '“They are not available right now.”', '“You have the wrong number; they left the company.”'],
    events: [{key:'right_person',label:'Reached the right person'},{key:'gatekeeper',label:'Assistant / switchboard answered'},{key:'unavailable',label:'Busy or unavailable'},{key:'wrong_contact',label:'Wrong contact / number'}]
  },
  {
    number: 2, name: 'Purpose', purpose: 'Explain in one or two clear sentences why you called, so the prospect could repeat it to a colleague.',
    likelySay: ['“What does your company actually do?”', '“Where did you get my number?”', '“This sounds like a sales call.”'],
    events: [{key:'asked_what',label:'Asked what we do'},{key:'asked_source',label:'Asked where number came from'},{key:'called_sales',label:'Called it a sales call'},{key:'understood',label:'Purpose understood'}]
  },
  {
    number: 3, name: 'Permission', purpose: 'Check whether they are willing to talk now. A clear yes, no, or callback time is useful; silence is not permission.',
    likelySay: ['“Call me after two / tomorrow.”', '“Send it on WhatsApp first.”', '“Yes, go ahead.”'],
    events: [{key:'yes',label:'Agreed to talk'},{key:'callback',label:'Asked for a callback'},{key:'send_first',label:'Asked to send information first'},{key:'no_time',label:'Not available now'}]
  },
  {
    number: 4, name: 'Their business', purpose: 'Ask about their company and work before describing yours. Listen and correct your assumptions.',
    likelySay: ['A short answer, then silence.', '“We do not make that / we are a different division.”', '“Tell me about your company first.”'],
    events: [{key:'described',label:'Described their business'},{key:'corrected',label:'Corrected my assumption'},{key:'asked_us',label:'Asked about us first'},{key:'brief',label:'Gave a brief answer'}]
  },
  {
    number: 5, name: 'Their need, in their words', purpose: 'Capture the goal or difficulty in the prospect’s own words. Write what they said, not your interpretation.',
    likelySay: ['A goal such as entering a new market or launching a product.', '“Everything is fine; we do not need anything.”', '“What can you do for a company like ours?”'],
    events: [{key:'named_need',label:'Named a goal or difficulty'},{key:'no_need',label:'Said there is no need'},{key:'asked_solution',label:'Asked what we could do'},{key:'unclear',label:'Need not clear yet'}]
  },
  {
    number: 6, name: 'Objection', purpose: 'Understand the reason behind a no before responding. Do not talk over the objection.',
    likelySay: ['“We already have an agency / consultant / in-house team.”', '“You need to speak to someone else.”', '“Send something in writing and we will see.”'],
    events: [{key:'existing_solution',label:'Already has a team / consultant'},{key:'wrong_person',label:'Not the decision-maker'},{key:'send_writing',label:'Asked for written information'},{key:'not_interested',label:'Clearly not interested'}]
  },
  {
    number: 7, name: 'Next step', purpose: 'Agree one concrete next action, with a time or channel: a scheduled call, meeting, document, or referral.',
    likelySay: ['“Send me a short note on WhatsApp.”', 'A specific callback time offered by the prospect.', 'A referral to a colleague, sometimes without contact details.'],
    events: [{key:'meeting',label:'Meeting agreed'},{key:'callback',label:'Callback time agreed'},{key:'send_info',label:'Send information'},{key:'referral',label:'Referred to a colleague'}]
  },
  {
    number: 8, name: 'Close', purpose: 'End clearly and record the actual outcome, next step, and the prospect’s exact words from stage 5.',
    likelySay: ['The line drops or the prospect hangs up.', 'A polite goodbye after declining.', 'A warm ending that can be mistaken for interest.'],
    events: [{key:'positive',label:'Positive next step agreed'},{key:'no',label:'Declined'},{key:'ended_early',label:'Call ended early / dropped'},{key:'no_answer',label:'No answer / wrong contact'}]
  }
];
export const outcomes = ['Meeting booked','Follow-up scheduled','Send information','Referred to someone','Not interested','No answer / wrong contact','Call dropped / ended early','Other'];
