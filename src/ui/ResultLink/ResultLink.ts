import {Component} from '../Base/Component';
import {ComponentOptions} from '../Base/ComponentOptions';
import {ComponentOptionsModel} from '../../models/ComponentOptionsModel';
import {IResultsComponentBindings} from '../Base/ResultsComponentBindings';
import {analyticsActionCauseList} from '../Analytics/AnalyticsActionListMeta';
import {IResultLinkOptions} from './ResultLinkOptions';
import {ResultListEvents} from '../../events/ResultListEvents';
import {HighlightUtils} from '../../utils/HighlightUtils';
import {IQueryResult} from '../../rest/QueryResult';
import {DeviceUtils} from '../../utils/DeviceUtils';
import {OS_NAME, OSUtils} from '../../utils/OSUtils';
import {Initialization} from '../Base/Initialization';
import {QueryUtils} from '../../utils/QueryUtils';
import {Assert} from '../../misc/Assert';
import {Utils} from '../../utils/Utils';
import {Defer} from '../../misc/Defer';
import {$$} from '../../utils/Dom';
import {StreamHighlightUtils} from '../../utils/StreamHighlightUtils';

/**
 * This component is intended to be used inside a result template, which must in turn be used inside a
 * {@link ResultList} component.
 *
 * By default, the ResultLink component automatically transforms a search result title into a clickable link pointing
 * to the original document.
 *
 * For more information on result templates, see
 * <a target="_blank" href="https://developers.coveo.com/x/v4okAg">Step 6 - Result Templates</a> of the Getting Started
 * with the JavaScript Search Framework V1 tutorial.
 */
export class ResultLink extends Component {
  static ID = 'ResultLink';

  /**
   * The options for the ResultLink
   * @componentOptions
   */
  static options: IResultLinkOptions = {

    /**
     * Specifies the field which the ResultLink should use to output its href.
     *
     * By default, the `clickUri` field available on the document is used, but you can override this field with this
     * option.
     *
     * #### Tip
     *
     * When you do not include a field option in your result template, you can include an href attribute on the
     * ResultLink element. When present, the href attribute value overrides the `clickUri` field, which is otherwise
     * used by default.
     *
     * Specifying an href attribute is useful when you want to build the ResultLink using a custom script or by
     * concatenating the content of two or more variables.
     *
     * #### Examples
     *
     * With the following markup, the ResultLink will output its href using the `uri` field instead of the default
     * `clickUri` field:
     *
     * ```html
     * <a class="CoveoResultLink" field="@uri"></a>
     * ```
     *
     * In the following result template, the link is provided by the custom `getMyKBUri()` function:
     *
     * ```html
     * <script id="KnowledgeArticle" type="text/underscore" class="result-template">
     *   <div class='CoveoIcon>'></div>
     *   <a class="CoveoResultLink" href="<%=getMyKBUri(raw)%>"></a>
     *   <div class="CoveoExcerpt"></div>
     * </script>
     * ```
     */
    field: ComponentOptions.buildFieldOption(),

    /**
     * Specifies whether the ResultLink should try to open in Microsoft Outlook.
     *
     * This option is normally intended for ResultLink instances which are related to Microsoft Exchange emails.
     *
     * Default value is `false`.
     */
    openInOutlook: ComponentOptions.buildBooleanOption({ defaultValue: false }),

    /**
     * Specifies whether the ResultLink should open in the {@link Quickview} component rather than loading through the
     * original URL.
     *
     * Default value is `false`.
     */
    openQuickview: ComponentOptions.buildBooleanOption(),

    /**
     * Specifies whether the ResultLink should open in a <a href="/" target="_blank">new tab/window</a> instead of
     * opening in the current context.
     *
     * Default value is `false`.
     */
    alwaysOpenInNewWindow: ComponentOptions.buildBooleanOption({ defaultValue: false }),

    /**
     * Specifies a template literal from which to generate the ResultLink href.
     *
     * This option overrides the ResultLink `field` option.</br>
     * The template literal can reference any number of fields from the associated result. It can also reference
     * global scope properties.
     *
     * Default value is `undefined`.
     * 
     * #### Examples
     *
     * The following markup will generate a ResultLink href such as `http://uri.com?id=documentTitle`:
     *
     * ```html
     * <a class="CoveoResultLink" data-href-template="${clickUri}?id=${title}"></a>
     * ```
     *
     * The following markup will generate a ResultLink href such as `localhost/fooBar`:
     * 
     * ```html
     * <a class="CoveoResultLink" data-href-template="$${window.location.hostname}/{Foo.Bar}"></a>
     * ```
     */
    hrefTemplate: ComponentOptions.buildStringOption(),

    /**
     * Specifies a template literal from which to generate the ResultLink display title.
     *
     * This option overrides the default ResultLink display title behavior.</br>
     * The template literal can reference any number of fields from the associated result. However, if the template
     * literal references a key whose value is undefined in the associated result fields, then the name of this key
     * will be displayed instead.</br>
     * This option is ignored if the ResultLink innerHTML contains any value.
     *
     * Default value is `undefined`.
     * 
     * #### Examples
     *
     * The following markup will generate a ResultLink display title such as `Case number: 123456` if both the
     * `raw.objecttype` and `raw.objectnumber` keys are defined in the associated result fields:
     *
     * ```html
     * <a class="CoveoResultLink" data-title-template="${raw.objecttype} number: ${raw.objectnumber}"></a>
     * ```
     *
     * The following markup will generate `${myField}` as a ResultLink display title if the `myField` key is undefined
     * in the associated result fields:
     *
     * ```html
     * <a class="CoveoResultLink" data-title-template="${myField}"></a>
     * ```
     *
     * The following markup will generate `This will be displayed` as a ResultLink display title, because the
     * ResultLink innterHTML is not empty:
     * 
     * ```html
     * <a class="CoveoResultLink" data-title-template="${will} ${be} ${ignored}">This will be displayed</a>
     * ```
     */
    titleTemplate: ComponentOptions.buildStringOption(),

    /**
     * Binds an event handler function which is executed when the component link is clicked.
     *
     * The handler function takes an EventObject and an {@link IQueryResult} as its parameters.
     *
     * Overriding the default behavior of the `onClick` event can allow you to execute specific code instead.
     *
     * #### Examples
     *
     * In the following code excerpt, a ResultLink is used to open the original document in a custom way instead of
     * using the normal browser behavior:
     *
     * ```javascript
     * Coveo.init(document.querySelector('#search'), {
     *   ResultLink : {
     *     onClick : function(e, result) {
     *       e.preventDefault();
     *       // Custom code to execute with the URI and title of the document
     *       openUriInASpecialTab(result.clickUri, result.title);
     *     }
     *   }
     * });
     * ```
     *
     * The same result can be achieved using the jQuery extension:
     *
     * ```javascript
     * $("#search").coveo('init', {
     *   ResultLink : {
     *     onClick : function(e, result) {
     *       e.preventDefault();
     *       // Custom code to execute with the URI and title of the document
     *       openUriInASpecialTab(result.clickUri, result.title);
     *     }
     *   }
     * });
     * ```
     */
    onClick: ComponentOptions.buildCustomOption<(e: Event, result: IQueryResult) => any>(() => {
      return null;
    })
  };

  static fields = [
    'outlookformacuri',
    'outlookuri',
    'connectortype',
    'urihash', // analytics
    'collection', // analytics
    'source', // analytics
    'author' // analytics
  ];

  constructor(public element: HTMLElement, public options: IResultLinkOptions, public bindings?: IResultsComponentBindings, public result?: IQueryResult, public os?: OS_NAME) {
    super(element, ResultLink.ID, bindings);
    this.options = ComponentOptions.initComponentOptions(element, ResultLink, options);
    this.options = _.extend({}, this.options, this.componentOptionsModel.get(ComponentOptionsModel.attributesEnum.resultLink));
    this.result = result || this.resolveResult();

    if (this.options.openQuickview == null) {
      this.options.openQuickview = result.raw['connectortype'] == 'ExchangeCrawler' && DeviceUtils.isMobileDevice();
    }

    this.element.setAttribute('tabindex', '0');

    Assert.exists(this.componentOptionsModel);
    Assert.exists(this.result);

    if (!this.quickviewShouldBeOpened()) {
      // We assume that anytime the contextual menu is opened on a result link
      // this is do "open in a new tab" or something similar.
      // This is not 100% accurate, but we estimate it to be the lesser of 2 evils (not logging anything)
      $$(element).on('contextmenu', () => {
        this.logOpenDocument();
      });
      $$(element).on('click', () => {
        this.logOpenDocument();
      });
    }
    if (/^\s*$/.test(this.element.innerHTML)) {
      if (!this.options.titleTemplate) {
        this.element.innerHTML = this.result.title ? HighlightUtils.highlightString(this.result.title, this.result.titleHighlights, null, 'coveo-highlight') : this.result.clickUri;
      } else {
        let newTitle = this.parseStringTemplate(this.options.titleTemplate);
        this.element.innerHTML = newTitle ? StreamHighlightUtils.highlightStreamText(newTitle, this.result.termsToHighlight, this.result.phrasesToHighlight) : this.result.clickUri;
      }
    }
    this.bindEventToOpen();
  }

  protected bindEventToOpen(): boolean {
    return this.bindOnClickIfNotUndefined() || this.bindOpenQuickviewIfNotUndefined() || this.setHrefIfNotAlready() || this.openLinkThatIsNotAnAnchor();
  }

  private bindOnClickIfNotUndefined() {
    if (this.options.onClick != undefined) {
      $$(this.element).on('click', (e: Event) => {
        this.options.onClick.call(this, e, this.result);
      });
      return true;
    } else {
      return false;
    }
  }

  private bindOpenQuickviewIfNotUndefined() {
    if (this.quickviewShouldBeOpened()) {
      $$(this.element).on('click', (e: Event) => {
        e.preventDefault();
        $$(this.bindings.resultElement).trigger(ResultListEvents.openQuickview);
      });
      return true;
    } else {
      return false;
    }
  }

  private openLinkThatIsNotAnAnchor() {
    if (!this.elementIsAnAnchor()) {
      $$(this.element).on('click', (ev: Event) => {
        if (this.options.alwaysOpenInNewWindow) {
          if (this.options.openInOutlook) {
            this.openLinkInOutlook();
          } else {
            this.openLinkInNewWindow();
          }
        } else {
          this.openLink();
        }
      });
      return true;
    }
    return false;
  }

  /**
   * Opens the result
   */
  public openLink() {
    window.location.href = this.getResultUri();
  }

  /**
   * Opens the result in a new window
   */
  public openLinkInNewWindow() {
    window.open(this.getResultUri(), '_blank');
  }

  /**
   * Opens the result in outlook if the result has an outlook field.
   */
  public openLinkInOutlook() {
    if (this.hasOutlookField()) {
      this.openLink();
    }
  }

  private setHrefIfNotAlready() {
    // Do not erase any value put in href by the template, etc. Allows
    // using custom click urls while still keeping analytics recording
    // and other behavior brought by the component.
    if (this.elementIsAnAnchor() && !Utils.isNonEmptyString($$(this.element).getAttribute('href'))) {
      $$(this.element).setAttribute('href', this.getResultUri());
      if (this.options.alwaysOpenInNewWindow && !(this.options.openInOutlook && this.hasOutlookField())) {
        $$(this.element).setAttribute('target', '_blank');
      }
      return true;
    } else {
      return false;
    }
  }

  private logOpenDocument = _.debounce(() => {
    this.queryController.saveLastQuery();
    let documentURL = $$(this.element).getAttribute('href');
    if (documentURL == undefined || documentURL == '') {
      documentURL = this.result.clickUri;
    }
    this.usageAnalytics.logClickEvent(analyticsActionCauseList.documentOpen, {
      documentURL: documentURL,
      documentTitle: this.result.title,
      author: this.result.raw.author
    }, this.result, this.root);
    Defer.flush();
  }, 1500, true);

  private getResultUri(): string {
    if (this.options.hrefTemplate) {
      return this.parseStringTemplate(this.options.hrefTemplate);
    }
    if (this.options.field == undefined && this.options.openInOutlook) {
      this.setField();
    }
    if (this.options.field != undefined) {
      return Utils.getFieldValue(this.result, <string>this.options.field);
    } else {
      return this.result.clickUri;
    }
  }

  private elementIsAnAnchor() {
    return this.element.tagName == 'A';
  }

  private setField() {
    let os = Utils.exists(this.os) ? this.os : OSUtils.get();
    if (os == OS_NAME.MACOSX && this.hasOutlookField()) {
      this.options.field = '@outlookformacuri';
    } else if (os == OS_NAME.WINDOWS && this.hasOutlookField()) {
      this.options.field = '@outlookuri';
    }
  }

  private hasOutlookField() {
    let os = Utils.exists(this.os) ? this.os : OSUtils.get();
    if (os == OS_NAME.MACOSX && this.result.raw['outlookformacuri'] != undefined) {
      return true;
    } else if (os == OS_NAME.WINDOWS && this.result.raw['outlookuri'] != undefined) {
      return true;
    }
    return false;
  }

  private isUriThatMustBeOpenedInQuickview(): boolean {
    return this.result.clickUri.toLowerCase().indexOf('ldap://') == 0;
  }

  private quickviewShouldBeOpened() {
    return (this.options.openQuickview || this.isUriThatMustBeOpenedInQuickview()) && QueryUtils.hasHTMLVersion(this.result);
  }

  private parseStringTemplate(template: string): string {
    if (!template) {
      return '';
    }
    return template.replace(/\$\{(.*?)\}/g, (value: string) => {
      let key = value.substring(2, value.length - 1);
      let newValue = this.readFromObject(this.result, key);
      if (!newValue) {
        newValue = this.readFromObject(window, key);
      }
      if (!newValue) {
        this.logger.warn(`${key} used in the ResultLink template is undefined for this result: ${this.result.title}`);
      }
      return newValue || value;
    });
  }

  private readFromObject(object: Object, key: string): string {
    if (object && key.indexOf('.') !== -1) {
      let newKey = key.substring(key.indexOf('.') + 1);
      key = key.substring(0, key.indexOf('.'));
      return this.readFromObject(object[key], newKey);
    }
    return object ? object[key] : undefined;
  }
}

Initialization.registerAutoCreateComponent(ResultLink);
