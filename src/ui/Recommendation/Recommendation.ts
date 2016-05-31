import {SearchInterface, ISearchInterfaceOptions} from '../SearchInterface/SearchInterface';
import {ComponentOptions} from '../Base/ComponentOptions';
import {QueryEvents, IQuerySuccessEventArgs, IBuildingQueryEventArgs} from '../../events/QueryEvents';
import {OmniboxEvents} from '../../events/OmniboxEvents';
import {ResultListEvents} from '../../events/ResultListEvents';
import {SettingsEvents} from '../../events/SettingsEvents';
import {PreferencesPanelEvents} from '../../events/PreferencesPanelEvents';
import {AnalyticsEvents} from '../../events/AnalyticsEvents';
import {BreadcrumbEvents} from '../../events/BreadcrumbEvents';
import {QuickviewEvents} from '../../events/QuickviewEvents';
import {QueryStateAttributes} from '../../models/QueryStateModel';
import {Model} from '../../models/Model';
import {IQueryResult} from '../../rest/QueryResult';
import {Utils} from '../../utils/Utils';
import {$$} from '../../utils/Dom';

declare var coveoanalytics: CoveoAnalytics.CoveoUA;

export interface IRecommendationOptions extends ISearchInterfaceOptions {
  mainSearchInterface?: HTMLElement;
  userContext?: { [name: string]: any };
  id?: string;
  linkSearchUid?: boolean;
  optionsToUse?: string[];
}

/**
 * This component is a {@link SearchInterface} that will display recommendations based on the user history.
 * To get recommendations, the page view script must also be included in the page. View: https://github.com/coveo/coveo.analytics.js
 * This component listens when the main search interface generates a query and it generates another to get the recommendations at the same time.
 *
 * This component can be included in another SearchInterface, but you need to initialize the recommendation component with Coveo('initRecommendation'), before
 * the parent SearchInterface.
 */
export class Recommendation extends SearchInterface {
  static ID = 'Recommendation';

  /**
   * The options for the recommendation component
   * @componentOptions
   */
  static options: IRecommendationOptions = {
    /**
     * Specifies the main {@link SearchInterface} to listen to.
     */
    mainSearchInterface: ComponentOptions.buildSelectorOption(),

    /**
     * Specifies the user context to send to Coveo analytics.
     * It will be sent with the query alongside the user history to get the recommendations.
     * If the option is not present, this component will display the same results as the main search interface.
     */
    userContext: ComponentOptions.buildObjectOption(),

    /**
     * Specifies the id of the inteface.
     * It is used by the analytics to know which recommendation interface was selected.
     * The default value is Recommendation
     */
    id: ComponentOptions.buildStringOption({ defaultValue: 'Recommendation' }),

    /**
     * Specifies if the results of the recommendation query should have the same searchUid as the ones from the main search interface query.
     * It is used to give info to the {@link Analytics}
     * The default value is true
     */
    linkSearchUid: ComponentOptions.buildBooleanOption({ defaultValue: true, depend: 'mainSearchInterface' }),

    /**
     * Specifies which options from the main {@link QueryBuilder} to use in the triggered query.
     * The default value is ["expression", "advancedExpression", "constantExpression", "disjunctionExpression"]
     */
    optionsToUse: ComponentOptions.buildListOption({ defaultValue: ['expression', 'advancedExpression', 'constantExpression', 'disjunctionExpression'] })

  };

  private mainInterfaceQuery: IQuerySuccessEventArgs;
  private mainQuerySearchUID: string;

  constructor(public element: HTMLElement, public options?: IRecommendationOptions, public analyticsOptions?, _window = window) {
    super(element, ComponentOptions.initComponentOptions(element, Recommendation, options), analyticsOptions, _window);

    if (this.options.mainSearchInterface) {
      this.bindToMainSearchInterface();
    }

    $$(this.element).on(QueryEvents.buildingQuery, (e: Event, args: IBuildingQueryEventArgs) => this.handleRecommendationBuildingQuery(args));
    $$(this.element).on(QueryEvents.querySuccess, (e: Event, args: IQuerySuccessEventArgs) => this.handleRecommendationQuerySuccess(args));

    // This is done to allow the component to be included in another search interface without triggering the parent events.
    this.preventEventPropagation();

  }

  public getId(): string {
    return this.options.id;
  }

  private bindToMainSearchInterface() {
    $$(this.options.mainSearchInterface).on(QueryEvents.querySuccess, (e: Event, args: IQuerySuccessEventArgs) => {
      this.mainInterfaceQuery = args;
      this.mainQuerySearchUID = args.results.searchUid;
      this.queryController.executeQuery({ ignoreWarningSearchEvent: true });
    })
  }

  private handleRecommendationBuildingQuery(data: IBuildingQueryEventArgs) {
    this.modifyQueryForRecommendation(data);
    this.addUserContextInQuery(data);
  }

  private handleRecommendationQuerySuccess(data: IQuerySuccessEventArgs) {
    if (this.mainQuerySearchUID && this.options.linkSearchUid) {
      data.results.searchUid = this.mainQuerySearchUID;
      _.each(data.results.results, (result: IQueryResult) => {
        result.queryUid = this.mainQuerySearchUID
      })
    }
  }

  private modifyQueryForRecommendation(data: IBuildingQueryEventArgs) {
    if (this.mainInterfaceQuery) {
      Utils.copyObjectAttributes(data.queryBuilder, this.mainInterfaceQuery.queryBuilder, this.options.optionsToUse);
    }
  }

  private addUserContextInQuery(data: IBuildingQueryEventArgs) {
    if (!_.isEmpty(this.options.userContext)) {
      data.queryBuilder.addContext(this.options.userContext);
    }

    data.queryBuilder.addContextValue('actions_history', JSON.stringify(this.getHistory()));
  }

  private getHistory() {
    if (typeof coveoanalytics != 'undefined') {
      var store = new coveoanalytics.history.HistoryStore();
      return store.getHistory();
    } else {
      return [];
    }
  }

  private preventEventPropagation() {
    this.preventEventPropagationOn(QueryEvents);
    this.preventEventPropagationOn(OmniboxEvents);
    this.preventEventPropagationOn(ResultListEvents);
    this.preventEventPropagationOn(SettingsEvents);
    this.preventEventPropagationOn(PreferencesPanelEvents);
    this.preventEventPropagationOn(AnalyticsEvents);
    this.preventEventPropagationOn(BreadcrumbEvents);
    this.preventEventPropagationOn(QuickviewEvents);
    this.preventEventPropagationOn(this.getAllModelEvents());
  }

  private preventEventPropagationOn(eventType, eventName = (event: string) => { return event }) {
    for (let event in eventType) {
      $$(this.root).on(eventName(event), (e: Event) => { e.stopPropagation() });
    }
  }

  private getAllModelEvents() {
    let events = {};
    _.each(_.values(Model.eventTypes), (event) => {
      _.each(_.values(QueryStateAttributes), (attribute) => {
        let eventName = this.getBindings().queryStateModel.getEventName(event + attribute);
        events[eventName] = eventName;
      })
    })
    return events;
  }

}
// We do not register the Recommendation component since it is done with .coveo('initRecommendation')