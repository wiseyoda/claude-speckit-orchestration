/**
 * Status message system for fun rotating messages during workflow execution.
 *
 * Features:
 * - Rarity-weighted selection (common, uncommon, rare, legendary)
 * - Category-based filtering (thinking, bash, read, edit, search, etc.)
 * - Time-of-day aware messages (morning, night, weekend)
 * - Seasonal messages (Halloween, Christmas, etc.)
 * - Collection tracking for gamification
 */

// MARK: - Types

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type Category = 'thinking' | 'executing' | 'bash' | 'read' | 'edit' | 'search' | 'web' | 'agent' | 'idle';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'weekend';
export type Season = 'halloween' | 'christmas' | 'newYear' | 'valentine';

export interface StatusMessage {
  id: string;
  text: string;
  emoji: string;
  rarity: Rarity;
  category: Category;
  timeOfDay?: TimeOfDay;
  seasonal?: Season;
}

// MARK: - Rarity Weights

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.12,
  legendary: 0.03,
};

// MARK: - Time & Season Detection

function getCurrentTimeOfDay(): TimeOfDay {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  if (day === 0 || day === 6) return 'weekend';
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getCurrentSeason(): Season | null {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const day = now.getDate();

  // Halloween: Oct 15 - Nov 1
  if ((month === 10 && day >= 15) || (month === 11 && day <= 1)) return 'halloween';
  // Christmas: Dec 15 - Dec 26
  if (month === 12 && day >= 15 && day <= 26) return 'christmas';
  // New Year: Dec 31 - Jan 2
  if ((month === 12 && day >= 31) || (month === 1 && day <= 2)) return 'newYear';
  // Valentine: Feb 13 - Feb 15
  if (month === 2 && day >= 13 && day <= 15) return 'valentine';

  return null;
}

// MARK: - ID Generation

function generateStableId(text: string, category: Category, timeOfDay?: TimeOfDay, seasonal?: Season): string {
  const parts = [text, category];
  if (timeOfDay) parts.push(timeOfDay);
  if (seasonal) parts.push(seasonal);
  const combined = parts.join('|');

  // Simple hash function
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) + combined.charCodeAt(i);
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

// MARK: - Message Builders

function simple(text: string, emoji: string, category: Category): StatusMessage {
  return { id: generateStableId(text, category), text, emoji, rarity: 'common', category };
}

function uncommon(text: string, emoji: string, category: Category): StatusMessage {
  return { id: generateStableId(text, category), text, emoji, rarity: 'uncommon', category };
}

function rare(text: string, emoji: string, category: Category): StatusMessage {
  return { id: generateStableId(text, category), text, emoji, rarity: 'rare', category };
}

function legendary(text: string, emoji: string, category: Category): StatusMessage {
  return { id: generateStableId(text, category), text, emoji, rarity: 'legendary', category };
}

function timed(text: string, emoji: string, category: Category, time: TimeOfDay, rarity: Rarity = 'uncommon'): StatusMessage {
  return { id: generateStableId(text, category, time), text, emoji, rarity, category, timeOfDay: time };
}

function seasonal(text: string, emoji: string, category: Category, season: Season, rarity: Rarity = 'uncommon'): StatusMessage {
  return { id: generateStableId(text, category, undefined, season), text, emoji, rarity, category, seasonal: season };
}

// MARK: - Message Pool

function buildMessagePool(): StatusMessage[] {
  const messages: StatusMessage[] = [];

  // MARK: Thinking Messages
  messages.push(
    simple('Thinking...', '💭', 'thinking'),
    simple('Processing...', '🧠', 'thinking'),
    simple('Pondering...', '🤔', 'thinking'),
    simple('Having ideas...', '💡', 'thinking'),
    simple('Focusing...', '🎯', 'thinking'),
    simple('Analyzing...', '🔍', 'thinking'),

    uncommon('Consulting the oracle...', '🔮', 'thinking'),
    uncommon('Channeling wisdom...', '✨', 'thinking'),
    uncommon('Brewing thoughts...', '☕', 'thinking'),
    uncommon('Neurons firing...', '⚡', 'thinking'),
    uncommon('Pushing up glasses...', '🤓', 'thinking'),
    uncommon('Getting creative...', '🎨', 'thinking'),
    uncommon('Piecing it together...', '🧩', 'thinking'),
    uncommon('In the zone...', '🌀', 'thinking'),
    uncommon('Consulting my rubber duck...', '🦆', 'thinking'),

    rare('You shall not pass... yet...', '🧙', 'thinking'),
    rare('Winter is coming... for this bug...', '⚔️', 'thinking'),
    rare('Accio solution...', '🪄', 'thinking'),
    rare("These aren't the bugs you're looking for...", '🌌', 'thinking'),
    rare('Taking the red pill...', '💊', 'thinking'),
    rare('We need to go deeper...', '🌀', 'thinking'),
    rare('My spidey sense is tingling...', '🕷️', 'thinking'),
    rare("This isn't even my final form...", '⚡', 'thinking'),
    rare('Believe it!', '🍥', 'thinking'),
    rare('Plus Ultra!', '💪', 'thinking'),

    legendary("Great Scott! I've got it!", '⚡', 'thinking'),
    legendary('I am one with the code...', '🎯', 'thinking'),
    legendary('Dormammu, I\'ve come to bargain...', '🔮', 'thinking'),
    legendary('May the source be with you...', '✨', 'thinking'),
  );

  // MARK: Executing Messages
  messages.push(
    simple('Preparing...', '⏳', 'executing'),
    simple('Warming up engines...', '🚀', 'executing'),
    simple('Getting ready...', '🔧', 'executing'),
    simple('Initializing...', '⚙️', 'executing'),
    simple('On it...', '🏃', 'executing'),
    simple('Working...', '⏳', 'executing'),

    uncommon('Setting the stage...', '🎬', 'executing'),
    uncommon('Tuning up...', '🎸', 'executing'),
    uncommon('One sec, coffee break...', '☕', 'executing'),
    uncommon('Stretching first...', '🤸', 'executing'),
    uncommon('Hold my beer...', '🍺', 'executing'),
    uncommon('Watch this...', '👀', 'executing'),

    rare('Roads? Where we\'re going...', '🚗', 'executing'),
    rare('And my axe!', '⚔️', 'executing'),
    rare('Hold onto your butts...', '🦖', 'executing'),
    rare('Never tell me the odds...', '🎰', 'executing'),
    rare('To infinity and beyond!', '🚀', 'executing'),
    rare('Leeeroy Jenkins!', '🐔', 'executing'),

    legendary('Alright alright alright...', '🎬', 'executing'),
    legendary('It\'s morphin\' time!', '⚡', 'executing'),
  );

  // MARK: Bash Messages
  messages.push(
    simple('Running command...', '💻', 'bash'),
    simple('Executing...', '🖥️', 'bash'),
    simple('Terminal time...', '⚡', 'bash'),

    uncommon('sudo make it happen...', '🎮', 'bash'),
    uncommon('Hacking the mainframe...', '👨‍💻', 'bash'),
    uncommon('I\'m in...', '🕶️', 'bash'),
    uncommon('Shell yeah...', '🐚', 'bash'),
    uncommon('Fingers crossed...', '🤞', 'bash'),

    rare('I know kung fu...', '🕶️', 'bash'),
    rare('It\'s a Unix system, I know this!', '💻', 'bash'),
    rare('Open the pod bay doors...', '🔴', 'bash'),
    rare('I\'ll be back... with results...', '🤖', 'bash'),
    rare('Execute Order 66...', '🎯', 'bash'),

    legendary('PC LOAD LETTER?!', '📺', 'bash'),
    legendary('Hack the planet!', '🌍', 'bash'),
  );

  // MARK: Read Messages
  messages.push(
    simple('Reading...', '📖', 'read'),
    simple('Taking a look...', '👀', 'read'),
    simple('Exploring...', '📂', 'read'),
    simple('Scanning...', '📡', 'read'),

    uncommon('Studying the archives...', '🤓', 'read'),
    uncommon('Hitting the books...', '📚', 'read'),
    uncommon('Peeking...', '👁️', 'read'),
    uncommon('Snooping around...', '🕵️', 'read'),
    uncommon('Diving deep...', '🤿', 'read'),

    rare('The sacred texts!', '📜', 'read'),
    rare('X marks the spot...', '🗺️', 'read'),
    rare('Enhance... enhance... enhance...', '👀', 'read'),
    rare('Elementary, my dear Watson...', '🔍', 'read'),

    legendary('It belongs in a museum!', '🏛️', 'read'),
  );

  // MARK: Edit Messages
  messages.push(
    simple('Editing...', '✏️', 'edit'),
    simple('Writing...', '📝', 'edit'),
    simple('Making changes...', '🔧', 'edit'),

    uncommon('Painting with code...', '🎨', 'edit'),
    uncommon('Polishing...', '💅', 'edit'),
    uncommon('Sprinkling magic...', '✨', 'edit'),
    uncommon('Surgical precision...', '🔪', 'edit'),
    uncommon('Chef\'s kiss incoming...', '😘', 'edit'),

    rare('Pray I don\'t alter it further...', '⚔️', 'edit'),
    rare('It\'s alive! IT\'S ALIVE!', '⚡', 'edit'),
    rare('We can rebuild it. Better. Stronger...', '🔧', 'edit'),

    legendary('I am inevitable (these changes)...', '🎯', 'edit'),
    legendary('I have the power!', '⚡', 'edit'),
  );

  // MARK: Search Messages
  messages.push(
    simple('Searching...', '🔎', 'search'),
    simple('Looking...', '🔍', 'search'),
    simple('Exploring...', '🗺️', 'search'),

    uncommon('Investigating...', '🕵️', 'search'),
    uncommon('On the trail...', '🔦', 'search'),
    uncommon('Treasure hunting...', '🏴‍☠️', 'search'),
    uncommon('Pattern matching...', '📊', 'search'),
    uncommon('Sherlocking...', '🔍', 'search'),

    rare('My precious... where is it...', '💍', 'search'),
    rare('The name\'s Grep. James Grep...', '🕵️', 'search'),
    rare('There is no try, only find...', '🎯', 'search'),
    rare('Where\'s Waldo?', '👓', 'search'),

    legendary('Just keep searching, just keep searching...', '🌊', 'search'),
    legendary('One does not simply find...', '💍', 'search'),
  );

  // MARK: Web Messages
  messages.push(
    simple('Fetching...', '🌐', 'web'),
    simple('Reaching out...', '📡', 'web'),
    simple('Surfing the web...', '🕸️', 'web'),

    uncommon('Riding the waves...', '🏄', 'web'),
    uncommon('Calling the internet...', '📞', 'web'),
    uncommon('Down the rabbit hole...', '🕳️', 'web'),
    uncommon('Hope it\'s not a 404...', '🤞', 'web'),

    rare('Follow the white rabbit...', '🐇', 'web'),
    rare('E.T. phone home...', '📡', 'web'),
    rare('Beam me up, Scotty...', '🚀', 'web'),
    rare('You\'ve got mail!', '💌', 'web'),

    legendary('Shall we play a game?', '🎰', 'web'),
  );

  // MARK: Agent Messages
  messages.push(
    simple('Agent working...', '🤖', 'agent'),
    simple('Delegating...', '👥', 'agent'),
    simple('Processing...', '🔄', 'agent'),

    uncommon('Agent deployed...', '🕵️', 'agent'),
    uncommon('Mission in progress...', '🎯', 'agent'),
    uncommon('Calling in backup...', '👷', 'agent'),
    uncommon('Player 2 has entered...', '🎮', 'agent'),

    rare('Avengers, assemble!', '🦸', 'agent'),
    rare('Autobots, roll out!', '🤖', 'agent'),
    rare('I volunteer as tribute!', '🎯', 'agent'),
    rare('For Frodo!', '⚔️', 'agent'),
    rare('Go go Power Rangers!', '⚡', 'agent'),

    legendary('Send in the clones!', '🎪', 'agent'),
  );

  // MARK: Time-of-Day Messages
  messages.push(
    timed('Good morning! Let\'s code...', '☀️', 'thinking', 'morning'),
    timed('Coffee and code...', '☕', 'thinking', 'morning'),
    timed('Early bird gets the merge...', '🌅', 'thinking', 'morning', 'rare'),

    timed('Burning the midnight oil...', '🌙', 'thinking', 'night'),
    timed('Night owl mode...', '🦉', 'thinking', 'night'),
    timed('3am thoughts hit different...', '🌌', 'thinking', 'night', 'legendary'),

    timed('Weekend warrior...', '🎮', 'thinking', 'weekend'),
    timed('Side project time?', '🏠', 'thinking', 'weekend'),
    timed('No meetings today...', '😎', 'thinking', 'weekend', 'rare'),
  );

  // MARK: Seasonal Messages
  messages.push(
    seasonal('Spooky season coding...', '🎃', 'thinking', 'halloween'),
    seasonal('Boo! Ready to haunt bugs...', '👻', 'thinking', 'halloween'),
    seasonal('Something wicked this way compiles...', '🦇', 'thinking', 'halloween', 'rare'),

    seasonal('Ho ho ho, let\'s go...', '🎄', 'thinking', 'christmas'),
    seasonal('Making a list, checking it twice...', '🎅', 'thinking', 'christmas'),
    seasonal('Dashing through the code...', '🦌', 'thinking', 'christmas', 'legendary'),

    seasonal('New year, new codebase...', '🎆', 'thinking', 'newYear'),
    seasonal('Cheers to no bugs...', '🥂', 'thinking', 'newYear'),

    seasonal('Code is my valentine...', '💕', 'thinking', 'valentine'),
    seasonal('Roses are red, builds are green...', '🌹', 'thinking', 'valentine', 'legendary'),
  );

  // MARK: Programming Humor
  messages.push(
    uncommon('Recursing... recursing...', '🔄', 'thinking'),
    uncommon('Stack overflow detected...', '📚', 'thinking'),
    uncommon('Garbage collecting...', '🗑️', 'thinking'),
    uncommon('This is fine...', '🔥', 'thinking'),
    uncommon('Big brain time...', '🧠', 'thinking'),

    rare('It works on my machine...', '🤷', 'executing'),
    rare('Have you tried console.log?', '📝', 'thinking'),
    rare('Turning coffee into code...', '☕', 'thinking'),
    rare('Friday deploy? YOLO...', '🎲', 'bash'),
    rare('Perfectly balanced...', '⚖️', 'thinking'),
  );

  // MARK: AI Self-Awareness
  messages.push(
    simple('Beep boop...', '🤖', 'thinking'),
    uncommon('Neural nets firing...', '⚡', 'thinking'),
    uncommon('Not hallucinating...', '👀', 'thinking'),
    uncommon('Token by token...', '🔤', 'thinking'),

    rare('I think therefore I code...', '🤔', 'thinking'),
    rare('Turing test: passed...', '✅', 'thinking'),

    legendary('I\'ve seen things...', '👁️', 'thinking'),
    legendary('Do androids dream?', '🐑', 'thinking'),
  );

  return messages;
}

// MARK: - Message Store

class StatusMessageStore {
  private messages: StatusMessage[];
  private recentMessageIds: string[] = [];
  private readonly recentWindowSize = 10;
  private seenMessageIds: Set<string>;

  private static instance: StatusMessageStore;

  private constructor() {
    this.messages = buildMessagePool();
    this.seenMessageIds = this.loadProgress();
  }

  static getInstance(): StatusMessageStore {
    if (!StatusMessageStore.instance) {
      StatusMessageStore.instance = new StatusMessageStore();
    }
    return StatusMessageStore.instance;
  }

  /**
   * Map a tool name to a category
   */
  private getCategoryForTool(tool?: string): Category {
    if (!tool) return 'thinking';

    const toolLower = tool.toLowerCase();
    switch (toolLower) {
      case 'bash':
      case 'bashoutput':
      case 'killshell':
        return 'bash';
      case 'read':
        return 'read';
      case 'glob':
      case 'grep':
        return 'search';
      case 'edit':
      case 'write':
      case 'notebookedit':
        return 'edit';
      case 'webfetch':
      case 'websearch':
        return 'web';
      case 'task':
      case 'todowrite':
        return 'agent';
      default:
        return 'executing';
    }
  }

  /**
   * Select a random message based on current tool/state
   */
  selectMessage(tool?: string): StatusMessage {
    const category = this.getCategoryForTool(tool);
    const currentTime = getCurrentTimeOfDay();
    const currentSeason = getCurrentSeason();

    // Filter by category, time, and season
    let pool = this.messages.filter((msg) => {
      if (msg.category !== category) return false;
      if (msg.timeOfDay && msg.timeOfDay !== currentTime) return false;
      if (msg.seasonal && msg.seasonal !== currentSeason) return false;
      return true;
    });

    // If no messages match, fall back to category only
    if (pool.length === 0) {
      pool = this.messages.filter((msg) => msg.category === category);
    }

    // Avoid repeating recent messages
    const filtered = pool.filter((msg) => !this.recentMessageIds.includes(msg.id));
    const candidates = filtered.length > 0 ? filtered : pool;

    if (candidates.length === 0) {
      return { id: 'fallback', text: 'Working...', emoji: '⏳', rarity: 'common', category: 'executing' };
    }

    // Weighted random selection
    const selected = this.weightedRandom(candidates);

    // Track selection
    this.remember(selected);

    return selected;
  }

  private weightedRandom(pool: StatusMessage[]): StatusMessage {
    const totalWeight = pool.reduce((sum, msg) => sum + RARITY_WEIGHTS[msg.rarity], 0);
    let random = Math.random() * totalWeight;

    // Shuffle to add variety within same weight
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    for (const msg of shuffled) {
      random -= RARITY_WEIGHTS[msg.rarity];
      if (random <= 0) return msg;
    }

    return pool[0];
  }

  private remember(message: StatusMessage): void {
    this.seenMessageIds.add(message.id);
    this.recentMessageIds.push(message.id);
    if (this.recentMessageIds.length > this.recentWindowSize) {
      this.recentMessageIds = this.recentMessageIds.slice(-this.recentWindowSize);
    }
    this.saveProgress();
  }

  private loadProgress(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const data = localStorage.getItem('statusMessageProgress');
      if (data) {
        const parsed = JSON.parse(data);
        return new Set(parsed.seenIds || []);
      }
    } catch {
      // Ignore errors
    }
    return new Set();
  }

  private saveProgress(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('statusMessageProgress', JSON.stringify({
        seenIds: Array.from(this.seenMessageIds),
        lastUpdated: new Date().toISOString(),
      }));
    } catch {
      // Ignore errors
    }
  }

  /**
   * Get collection statistics
   */
  getStats(): { total: number; seen: number; byRarity: Record<Rarity, { seen: number; total: number }> } {
    const byRarity: Record<Rarity, { seen: number; total: number }> = {
      common: { seen: 0, total: 0 },
      uncommon: { seen: 0, total: 0 },
      rare: { seen: 0, total: 0 },
      legendary: { seen: 0, total: 0 },
    };

    for (const msg of this.messages) {
      byRarity[msg.rarity].total++;
      if (this.seenMessageIds.has(msg.id)) {
        byRarity[msg.rarity].seen++;
      }
    }

    return {
      total: this.messages.length,
      seen: this.seenMessageIds.size,
      byRarity,
    };
  }
}

// MARK: - Export

export const statusMessageStore = StatusMessageStore.getInstance();

/**
 * Get a random status message for the given tool
 */
export function getStatusMessage(tool?: string): StatusMessage {
  return statusMessageStore.selectMessage(tool);
}

/**
 * Get collection statistics
 */
export function getStatusMessageStats() {
  return statusMessageStore.getStats();
}
