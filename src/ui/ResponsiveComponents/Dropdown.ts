import {DropdownHeader} from './DropdownHeader';
import {DropdownContent} from './DropdownContent';
import {$$, Dom} from '../../utils/Dom';
import {EventsUtils} from '../../utils/EventsUtils';

export class Dropdown {

  public static TRANSPARENT_BACKGROUND_OPACITY: string = '0.9';

  public dropdownContent: DropdownContent;
  public dropdownHeader: DropdownHeader;
  public isOpened: boolean = false;

  private onOpenHandlers: Function[] = [];
  private onCloseHandlers: Function[] = [];
  private popupBackground: Dom;

  constructor(componentName: string, content: Dom, header: Dom, private coveoRoot, minWidth: number, widthRatio: number) {
    this.popupBackground = this.buildPopupBackground();
    this.dropdownHeader = new DropdownHeader(componentName, header);
    this.dropdownContent = new DropdownContent(componentName, content, this.coveoRoot, minWidth, widthRatio);
    this.bindOnClickDropdownHeaderEvent();
  }

  public registerOnOpenHandler(handler: Function) {
    this.onOpenHandlers.push(handler);
  }

  public registerOnCloseHandler(handler: Function) {
    this.onCloseHandlers.push(handler);
  }

  public cleanUp() {
    this.close();
    this.dropdownHeader.cleanUp();
    this.dropdownContent.cleanUp();
  }

  public open() {
    this.isOpened = true;
    this.dropdownHeader.open();
    this.dropdownContent.positionDropdown();
    _.each(this.onOpenHandlers, handler => {
      handler();
    });
    this.coveoRoot.el.appendChild(this.popupBackground.el);
    window.getComputedStyle(this.popupBackground.el).opacity;
    this.popupBackground.el.style.opacity = Dropdown.TRANSPARENT_BACKGROUND_OPACITY;
  }

  public close() {
    this.isOpened = false;
    _.each(this.onCloseHandlers, handler => {
      handler();
    });
    this.dropdownHeader.close();
    this.dropdownContent.hideDropdown();

    // Because of DOM manipulation, sometimes the animation will not trigger. Accessing the computed styles makes sure
    // the animation will happen. Adding this here because its possible that this element has recently been manipulated.
    window.getComputedStyle(this.popupBackground.el).opacity;
    this.popupBackground.el.style.opacity = '0';
  }

  private bindOnClickDropdownHeaderEvent() {
    this.dropdownHeader.element.on('click', () => {
      if (this.isOpened) {
        this.close();
      } else {
        this.open();
      }
    });
  }

  private buildPopupBackground(): Dom {
    let popupBackground = $$('div', { className: 'coveo-facet-dropdown-background' });
    EventsUtils.addPrefixedEvent(popupBackground.el, 'TransitionEnd', () => {
      if (popupBackground.el.style.opacity == '0') {
        popupBackground.detach();
      }
    });
    popupBackground.on('click', () => this.close());
    return popupBackground;
  }
}