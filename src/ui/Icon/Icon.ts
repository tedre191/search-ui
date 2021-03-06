import {Component} from '../Base/Component';
import {IComponentBindings} from '../Base/ComponentBindings';
import {ComponentOptions} from '../Base/ComponentOptions';
import {IQueryResult} from '../../rest/QueryResult';
import {Assert} from '../../misc/Assert';
import {QueryUtils} from '../../utils/QueryUtils';
import {Initialization} from '../Base/Initialization';
import {Utils} from '../../utils/Utils';
import {FileTypes, IFileTypeInfo} from '../Misc/FileTypes';
import {Quickview} from '../Quickview/Quickview';
import {$$} from '../../utils/Dom';

/**
 * Available options for the {@link Icon} component.
 */
export interface IIconOptions {
  value?: string;
  small?: boolean;
  withLabel?: boolean;
  labelValue?: string;
}

/**
 * This component is intended to be used inside a result template, which must in turn be used inside a
 * {@link ResultList} component.
 *
 * The Icon component outputs the corresponding icon for a given file type. The component searches for a suitable icon
 * from those available in the framework. If no suitable icon is found, the component outputs a generic icon instead.
 *
 * For more information on result templates, see
 * <a target="_blank" href="https://developers.coveo.com/x/v4okAg">Step 6 - Result Templates</a> of the Getting Started
 * with the JavaScript Search Framework V1 tutorial.
 */
export class Icon extends Component {
  static ID = 'Icon';

  /**
   * The options for the Icon
   * @componentOptions
   */
  static options: IIconOptions = {

    /**
     * Specifies the value that the Icon component should output as its CSS class instead of the auto-selected value.
     *
     * Default value is `undefined`, and the framework will find a suitable icon based on the result file type.
     */
    value: ComponentOptions.buildIconOption(),

    /**
     * Specifies whether the Icon component should output the smaller version of the icon instead of of the regular one.
     *
     * Default value is `false`.
     */
    small: ComponentOptions.buildBooleanOption(),

    /**
     * Specifies whether the Icon component should force the output icon to display its caption/label or not.
     *
     * Due to limited screen real estate, setting this option to `true` has no effect on icons set into insight panels.
     *
     * Default value is `undefined`, and the framework will determine if the icon needs to display a caption/label based
     * of the result file type.
     */
    withLabel: ComponentOptions.buildBooleanOption(),

    /**
     * Specifies what text should be displayed on the icon caption/label.
     *
     * Default value is `undefined`, and the framework will determine what text the icon needs to display based on the
     * result file type.
     */
    labelValue: ComponentOptions.buildLocalizedStringOption()
  };

  static fields = [
    'objecttype',
    'filetype',
  ];

  /**
   * Creates a new Icon component
   * @param element
   * @param options
   * @param bindings
   * @param result
   */
  constructor(public element: HTMLElement, public options?: IIconOptions, bindings?: IComponentBindings, public result?: IQueryResult) {
    super(element, Icon.ID, bindings);

    this.options = ComponentOptions.initComponentOptions(element, Icon, options);
    this.result = this.result || this.resolveResult();
    Assert.exists(this.result);

    var possibleInternalQuickview = $$(this.element).find('.' + Component.computeCssClassNameForType(Quickview.ID));
    if (!Utils.isNullOrUndefined(possibleInternalQuickview) && QueryUtils.hasHTMLVersion(this.result)) {
      $$(this.element).addClass('coveo-with-quickview');
      $$(this.element).on('click', () => {
        var qv: Quickview = <Quickview>Component.get(possibleInternalQuickview);
        qv.open();
      });
    }

    Icon.createIcon(this.result, this.options, element, bindings);
  }

  static createIcon(result: IQueryResult, options: IIconOptions = {}, element: HTMLElement = $$('div').el, bindings?: IComponentBindings) {
    var info = FileTypes.get(result);
    info = Icon.preprocessIconInfo(options, info);
    $$(element).toggleClass('coveo-small', options.small === true);

    if (options.value != undefined) {
      if (options.small === true) {
        if (options.value.indexOf('-small') == -1) {
          info.icon += '-small';
        }
      }
      if (options.small === false) {
        if (options.value.indexOf('-small') != -1) {
          info.icon = info.icon.replace('-small', '');
        }
      }
    }
    $$(element).addClass(info.icon);
    element.setAttribute('title', info.caption);

    if (Icon.shouldDisplayLabel(options, bindings)) {
      element.appendChild($$('span', {
        className: 'coveo-icon-caption-overlay'
      }, info.caption).el);
      $$(element).addClass('coveo-icon-with-caption-overlay');
    }
    return element;
  }

  static shouldDisplayLabel(options: IIconOptions, bindings: IComponentBindings) {
    // Display only in new design.
    // If withLabel is explicitely set to false, the label will never display
    // If withLabel is explicitely set to true, the label will always display
    // If withLabel is set to default value (not a hard true or false), the label will display based on ./core/filetypes/**.json
    // with the property shouldDisplayLabel set on each file type/ objecttype
    // In this case, the generated css will take care of outputting the correct css to display : block
    return bindings && bindings.searchInterface.isNewDesign() && options.withLabel !== false;
  }

  static preprocessIconInfo(options: IIconOptions, info: IFileTypeInfo) {
    if (options.labelValue != null) {
      info.caption = options.labelValue;
    }
    if (options.value != null) {
      info.icon = 'coveo-icon ' + options.value;
    }
    if (info.caption == null) {
      info.caption = '';
    }
    if (info.icon == null) {
      info.icon = 'coveo-icon coveo-sprites-custom';
    }
    return info;
  }
}
Initialization.registerAutoCreateComponent(Icon);
