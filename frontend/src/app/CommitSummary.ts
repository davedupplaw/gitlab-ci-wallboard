export default class CommitSummary {
  feat = 0;
  chore = 0;
  docs = 0;
  refactor = 0;
  localize = 0;
  style = 0;
  test = 0;
  fix = 0;

  reset() {
    this.feat = this.chore = this.docs =
      this.localize = this.refactor = this.style =
        this.test = this.fix = 0;
  }

  add( commitSummary: CommitSummary ) {
    const newSummary = new CommitSummary();
    newSummary.feat = this.feat + commitSummary.feat;
    newSummary.chore = this.chore + commitSummary.chore;
    newSummary.docs = this.docs + commitSummary.docs;
    newSummary.refactor = this.refactor + commitSummary.refactor;
    newSummary.localize = this.localize + commitSummary.localize;
    newSummary.style = this.style + commitSummary.style;
    newSummary.test = this.test + commitSummary.test;
    newSummary.fix = this.fix + commitSummary.fix;
    return newSummary;
  }

  toString() {
    return `{feat: ${this.feat}, chore: ${this.chore}, docs: ${this.docs}, refactor: ${this.refactor},` +
      `localize: ${this.localize}, style: ${this.style}, test: ${this.test}, fix: ${this.fix}}`;
  }

  getDataLabels() {
    return ['feat', 'chore', 'docs', 'refactor', 'localize', 'style', 'test', 'fix'];
  }

  counts() {
    return [this.feat, this.chore, this.docs, this.refactor, this.localize, this.style, this.test, this.fix];
  }
}
