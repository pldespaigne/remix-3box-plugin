import { PluginClient } from '@remixproject/plugin';
import { default as Box} from '3box';

const enum Steps { connect, login, logout, noMetaMask };

export class SpacePlugin extends PluginClient {

  isLoaded: boolean; // TODO remove that ! Use `this.loaded` or `this.onload()`
  step: number;
  mainBtn: HTMLButtonElement;
  enable: boolean;
  ethereumProvider: any; // TODO check if MetaMask has types
  address: string;

  // 3Box doesn't support TypeScript :(
  box: any;
  spaces: Record<string, any>;

  constructor() {
    super();
    this.onload().then(()=>{
      console.log('*** plugin loaded');
      this.isLoaded = true;
      this.mainBtn.addEventListener('click', () => this.connector());
    });

    

    this.isLoaded = false;
    this.enable = false;
    this.step = Steps.connect;
    this.mainBtn = document.querySelector<HTMLButtonElement>('#main-btn')!;
    this.ethereumProvider = window['ethereum'];
    this.spaces = {};
    this.methods = [
      'isEnabled',
      'openSpace',
      'getValue',
      'setValue',
    ];

    if (!this.ethereumProvider || !this.ethereumProvider.isMetaMask) {
      this.step = Steps.noMetaMask;
      this.mainBtn.innerHTML = 'Download MetaMask to continue';
      this.mainBtn.disabled = true;
    }
  }

  /** 
  * this function handle the ui and the plugin life cycle,
  * it is called every time the user click on the main button
  */
  private async connector() {
    this.requireLoaded();

    switch (this.step) {
      case Steps.connect:
        [this.address] = await this.ethereumProvider.enable();
        this.step = Steps.login;
        this.mainBtn.innerHTML = 'Login to 3Box';
        break;

      case Steps.login:
        this.box = await Box.openBox(this.address, this.ethereumProvider);
        this.step = Steps.logout;
        this.enable = true;
        this.mainBtn.innerHTML = 'Logout';
        console.log(this.box);
        break;

      case Steps.logout:
        delete this.address;
        delete this.ethereumProvider;
        delete this.box;
        this.enable = false;
        this.step = Steps.connect;
        this.mainBtn.innerHTML = 'Connect MetaMask';
        break;

      default: console.warn('Please Download MetaMask to continue'); // TODO better error
        break;
    }
  }

  //-----------------------------------------
  //        FUNCTIONS EXPOSED TO CALL
  //-----------------------------------------

  public isEnabled() {
    if (this.requireLoaded()) return;
    return this.enable;
  }

  public async openSpace() {
    console.log('*** openSpace');
    try {
      if (this.requireEnabled()) return false;
      const space = await this.box.openSpace(this.currentRequest.from);
      this.spaces[this.currentRequest.from] = space;
      console.log(this.spaces);
      return true;
    } catch(err) {
      console.error('An error happened during "openSpace()" :', err);
      return false;
    }
  }

  public async getValue(key: string) {
    console.log('*** getValue', key);
    if (this.requireSpaceOpened(this.currentRequest.from)) return;
    
    return await this.spaces[this.currentRequest.from].private.get(key);
  }

  public async setValue(key: string, value: string) {
    console.log('*** setValue', key, value);
    if (this.requireSpaceOpened(this.currentRequest.from)) return;
    
    return await this.spaces[this.currentRequest.from].private.set(key, value);
  }

  //-----------------------------------------
  //                 CHECKS
  //-----------------------------------------

  private requireLoaded() {
    if (!this.isLoaded) {
      console.error('Space Plugin is not yet loaded on the IDE !');
      return true;
    }
    return false;
  }

  private requireEnabled() {
    if (this.requireLoaded() || !this.enable) {
      console.error('Space Plugin is not yet enabled ! Please connect MetaMask and Login to 3Box.');
      return true;
    }
    return false;
  }

  private requireSpaceOpened(spaceName: string) {
    if (this.requireEnabled() || !this.spaces[spaceName]) {
      console.warn(spaceName);
      console.warn(this.spaces);
      console.warn(this.spaces[spaceName]);
      console.warn(!!this.spaces[spaceName]);
      console.error('Unkown Space ! Please call openSpace() before.');
      return true;
    }
    return false;
  }
}