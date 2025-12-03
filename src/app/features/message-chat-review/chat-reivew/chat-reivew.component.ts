import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { ChatReviewService } from '../services/chat-review.service';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { TooltipModule } from 'primeng/tooltip';
import {
  Chat,
  ChatTimeFilter,
  ChatsListRequest,
  ChatsListResponse,
  LastMessage,
  MessagesRequest,
  MessagesResponse,
  Participant,
} from '../models/chat-review.models';
import { distinctUntilChanged, Subject, takeUntil, timeout } from 'rxjs';
import { DatePipe, CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-chat-reivew',
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    Select,
    ScrollPanelModule,
    AvatarModule,
    DividerModule,
    ProgressSpinnerModule,
    ToastModule,
    ConfirmPopupModule,
    ReactiveFormsModule,
    FormsModule,
    TooltipModule,
    CommonModule,
    TranslatePipe,
    TagModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './chat-reivew.component.html',
  styleUrl: './chat-reivew.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatReivewComponent implements OnInit, OnDestroy {
  // Data properties
  chats: Chat[] = [];
  messages: LastMessage[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  loadingMessages: boolean = false;

  // Color tracking for participants
  private participantColors = new Map<string, string>();

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Messages pagination
  messagesFirst: number = 0;
  messagesRows: number = 20;
  messagesCurrentPage: number = 1;
  messagesTotalRecords: number = 0;

  // Filter properties
  private _timeFilter: ChatTimeFilter = ChatTimeFilter.All;
  timeFilterOptions: { label: string; value: ChatTimeFilter }[] = [];

  get timeFilter(): ChatTimeFilter {
    return this._timeFilter;
  }

  set timeFilter(value: ChatTimeFilter) {
    if (this._timeFilter !== value) {
      this._timeFilter = value;
      this.onTimeFilterChange();
    }
  }

  // Selected chat for viewing
  selectedChat: Chat | null = null;
  selectedChatParticipants: Participant[] = [];

  // Form properties
  filterForm!: FormGroup;

  private destroy$ = new Subject<void>();
  private currentRequest?: any;
  private messagesRequest?: any;
  pageReportTemplate: string = '';

  constructor(
    private chatReviewService: ChatReviewService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {
    this.initializeForm();
    this.buildTimeFilterOptions();
    this.updatePageReportTemplate();
    this.observeLanguageChanges();
  }

  ngOnInit(): void {
    this.loadChats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Force stop any pending requests
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }
    if (this.messagesRequest) {
      this.messagesRequest.unsubscribe();
    }
    this.loading = false;
    this.loadingMessages = false;
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.buildTimeFilterOptions();
      this.updatePageReportTemplate();
      this.cdr.markForCheck();
    });
  }

  private buildTimeFilterOptions(): void {
    this.timeFilterOptions = [
      { label: this.t('chatReview.filters.all'), value: ChatTimeFilter.All },
      { label: this.t('chatReview.filters.last24Hours'), value: ChatTimeFilter.Last24Hours },
      { label: this.t('chatReview.filters.lastWeek'), value: ChatTimeFilter.LastWeek },
      { label: this.t('chatReview.filters.lastMonth'), value: ChatTimeFilter.LastMonth },
    ];
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      timeFilter: [ChatTimeFilter.All],
    });
  }

  /**
   * Load chats with pagination and time filter
   */
  loadChats(): void {
    // Cancel previous request if still pending
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }

    this.loading = true;

    const request: ChatsListRequest = {
      timeFilter: this.timeFilter,
      pageSize: this.rows,
      currentPage: this.currentPage,
    };

    this.currentRequest = this.chatReviewService
      .getChatsList(request)
      .pipe(
        timeout(30000), // 30 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: ChatsListResponse) => {
          try {
            this.chats = response.data || [];
            this.totalRecords = response.totalCount || 0;
            this.loading = false;
            this.currentRequest = undefined;
            this.cdr.detectChanges();
          } catch (error) {
            console.error('Error processing response:', error);
            this.loading = false;
            this.currentRequest = undefined;
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          console.error('API Error:', error);
          this.loading = false;
          this.chats = [];
          this.totalRecords = 0;
          this.currentRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('chatReview.notification.loadError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Handle time filter change
   */
  onTimeFilterChange(): void {
    // timeFilter is already updated by ngModel binding
    this.first = 0;
    this.currentPage = 1;
    this.loadChats();
    this.cdr.markForCheck();
  }

  /**
   * Handle pagination change
   */
  pageChange(event: any): void {
    // Prevent multiple rapid calls
    if (this.loading) {
      return;
    }

    this.first = event.first || 0;
    this.rows = event.rows || 10;

    // Calculate current page (API expects 1-based page numbers)
    this.currentPage = Math.floor(this.first / this.rows) + 1;

    this.loadChats();
  }

  /**
   * View chat messages
   */
  viewChat(chat: Chat): void {
    this.selectedChat = chat;
    this.selectedChatParticipants = chat.participants || [];
    this.messagesFirst = 0;
    this.messagesCurrentPage = 1;
    this.messagesTotalRecords = 0;
    this.messages = [];
    // Clear color assignments for new chat
    this.participantColors.clear();
    this.loadChatMessages();
  }

  /**
   * Load messages for selected chat
   */
  loadChatMessages(): void {
    if (!this.selectedChat) return;

    // Cancel previous request if still pending
    if (this.messagesRequest) {
      this.messagesRequest.unsubscribe();
    }

    this.loadingMessages = true;

    const request: MessagesRequest = {
      chatId: this.selectedChat.chatId,
      pageSize: this.messagesRows,
      currentPage: this.messagesCurrentPage,
    };

    this.messagesRequest = this.chatReviewService
      .getChatMessages(request)
      .pipe(timeout(30000), takeUntil(this.destroy$))
      .subscribe({
        next: (response: MessagesResponse) => {
          try {
            // Reverse the order for chat display (newest first)
            const newMessages = response.data || [];
            this.messages = [...newMessages.reverse(), ...this.messages];
            this.messagesTotalRecords = response.totalCount || 0;
            this.loadingMessages = false;
            this.messagesRequest = undefined;
            this.cdr.detectChanges();
          } catch (error) {
            console.error('Error processing messages response:', error);
            this.loadingMessages = false;
            this.messagesRequest = undefined;
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          console.error('Messages API Error:', error);
          this.loadingMessages = false;
          this.messagesRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('chatReview.notification.messagesLoadError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Handle scroll in chat container to load more messages
   */
  onChatScroll(event: any): void {
    const element = event.target;
    const threshold = 100; // Load more when within 100px of top

    if (
      element.scrollTop <= threshold &&
      !this.loadingMessages &&
      this.messagesCurrentPage < Math.ceil(this.messagesTotalRecords / this.messagesRows)
    ) {
      this.messagesCurrentPage++;
      this.loadChatMessages();
    }
  }

  /**
   * Close chat viewer
   */
  closeChat(): void {
    this.selectedChat = null;
    this.messages = [];
    this.selectedChatParticipants = [];
    this.participantColors.clear();
  }

  /**
   * Get participant display name
   */
  getParticipantDisplayName(participant: Participant): string {
    return participant.displayName || participant.username || 'Unknown User';
  }

  /**
   * Get participant avatar URL
   */
  getParticipantAvatar(participant: Participant): string {
    return participant.avatar || '';
  }

  /**
   * Check if participant is online
   */
  isParticipantOnline(participant: Participant): boolean {
    return participant.isOnline;
  }

  /**
   * Format message time
   */
  formatMessageTime(sentAt: string): string {
    const date = new Date(sentAt);
    return date.toLocaleString(this.languageService.getCurrentLanguage());
  }

  /**
   * Get message sender display name
   */
  getMessageSenderName(message: LastMessage): string {
    return message.senderName || 'Unknown';
  }

  /**
   * Check if message is from current user (admin)
   */
  isMessageFromAdmin(message: LastMessage): boolean {
    return message.isOwn;
  }

  /**
   * Get color for participant messages
   */
  getParticipantColor(senderId: string): string {
    // Check if we already assigned a color to this participant
    if (this.participantColors.has(senderId)) {
      return this.participantColors.get(senderId)!;
    }

    // Assign next available color
    const colors = [
      'var(--p-teal-100)',
      'var(--p-cyan-100)',
      'var(--p-sky-100)',
      'var(--p-indigo-100)',
      'var(--p-violet-100)',
      'var(--p-emerald-100)',
    ];

    const assignedColors = Array.from(this.participantColors.values());
    const availableColor = colors.find((color) => !assignedColors.includes(color)) || colors[0];

    this.participantColors.set(senderId, availableColor);
    return availableColor;
  }

  /**
   * Force reset loading state (for debugging)
   */
  resetLoadingState(): void {
    this.loading = false;
    this.loadingMessages = false;
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
      this.currentRequest = undefined;
    }
    if (this.messagesRequest) {
      this.messagesRequest.unsubscribe();
      this.messagesRequest = undefined;
    }
    this.cdr.detectChanges();
  }

  private updatePageReportTemplate(): void {
    this.pageReportTemplate = this.t('table.currentPageReport');
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}
