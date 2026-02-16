
import { PTETask } from './types';

export const PTE_TASKS: PTETask[] = [
  // Speaking
  { id: 's1', section: 'Speaking', name: 'Read Aloud', description: 'Read a text from the screen', currentCount: 0, targetCount: 5 },
  { id: 's2', section: 'Speaking', name: 'Repeat Sentence', description: 'Hear a sentence and repeat it', currentCount: 0, targetCount: 10 },
  { id: 's3', section: 'Speaking', name: 'Describe Image', description: 'Explain a chart or picture', currentCount: 0, targetCount: 5 },
  { id: 's4', section: 'Speaking', name: 'Retell Lecture', description: 'Summarize a recording', currentCount: 0, targetCount: 3 },
  { id: 's5', section: 'Speaking', name: 'Answer Short Question', description: 'Brief answer to a question', currentCount: 0, targetCount: 10 },
  
  // Writing
  { id: 'w1', section: 'Writing', name: 'Summarize Written Text', description: 'Write a one-sentence summary', currentCount: 0, targetCount: 2 },
  { id: 'w2', section: 'Writing', name: 'Write Essay', description: '200-300 word formal essay', currentCount: 0, targetCount: 1 },
  
  // Reading
  { id: 'r1', section: 'Reading', name: 'Reading & Writing: Fill Blanks', description: 'Drop-down options in text', currentCount: 0, targetCount: 5 },
  { id: 'r2', section: 'Reading', name: 'Multiple Choice (Multiple)', description: 'Select all correct answers', currentCount: 0, targetCount: 2 },
  { id: 'r3', section: 'Reading', name: 'Re-order Paragraphs', description: 'Drag text into correct order', currentCount: 0, targetCount: 3 },
  { id: 'r4', section: 'Reading', name: 'Fill in the Blanks (Reading)', description: 'Drag and drop words', currentCount: 0, targetCount: 5 },
  
  // Listening
  { id: 'l1', section: 'Listening', name: 'Summarize Spoken Text', description: 'Write 50-70 words summary', currentCount: 0, targetCount: 2 },
  { id: 'l2', section: 'Listening', name: 'Fill in the Blanks', description: 'Type missing words from audio', currentCount: 0, targetCount: 3 },
  { id: 'l3', section: 'Listening', name: 'Highlight Correct Summary', description: 'Choose the best summary', currentCount: 0, targetCount: 2 },
  { id: 'l4', section: 'Listening', name: 'Write from Dictation', description: 'Type the exact sentence heard', currentCount: 0, targetCount: 10 }
];

export const MOCK_HISTORY = [
  { date: '2023-10-20', completedTasks: ['s1', 's2', 'w1'], totalTasks: 15 },
  { date: '2023-10-21', completedTasks: ['s1', 's2', 's3', 'w2', 'r1'], totalTasks: 15 },
  { date: '2023-10-22', completedTasks: ['s1', 'r1', 'r2', 'l1'], totalTasks: 15 },
  { date: '2023-10-23', completedTasks: ['s1', 's2', 's3', 's4', 's5', 'w1', 'w2', 'r1', 'r2', 'r3', 'r4', 'l1', 'l2', 'l3', 'l4'], totalTasks: 15 },
];
