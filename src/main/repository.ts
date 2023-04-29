export default interface Repository {
  getName(): String;
  getDirectory(): String;
  getType(): String;
  isDefault(): Boolean;
}
