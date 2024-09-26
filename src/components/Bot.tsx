import { createSignal, createEffect, For, onMount, Show, mergeProps, on, createMemo } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import {
  sendMessageQuery,
  upsertVectorStoreWithFormData,
  isStreamAvailableQuery,
  IncomingInput,
  getChatbotConfig,
  FeedbackRatingType,
} from '@/queries/sendMessageQuery';
import { TextInput } from './inputs/textInput';
import { GuestBubble } from './bubbles/GuestBubble';
import { BotBubble } from './bubbles/BotBubble';
import { LoadingBubble } from './bubbles/LoadingBubble';
import { StarterPromptBubble } from './bubbles/StarterPromptBubble';
import { BotMessageTheme, FooterTheme, TextInputTheme, UserMessageTheme, FeedbackTheme, DisclaimerPopUpTheme } from '@/features/bubble/types';
import { Badge } from './Badge';
import { Popup, DisclaimerPopup } from '@/features/popup';
import { Avatar } from '@/components/avatars/Avatar';
import { DeleteButton, SendButton } from '@/components/buttons/SendButton';
import { FilePreview } from '@/components/inputs/textInput/components/FilePreview';
import { CircleDotIcon, TrashIcon } from './icons';
import { CancelButton } from './buttons/CancelButton';
import { cancelAudioRecording, startAudioRecording, stopAudioRecording } from '@/utils/audioRecording';
import { LeadCaptureBubble } from '@/components/bubbles/LeadCaptureBubble';
import { removeLocalStorageChatHistory, getLocalStorageChatflow, setLocalStorageChatflow, setCookie, getCookie } from '@/utils';
import { cloneDeep } from 'lodash';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export type FileEvent<T = EventTarget> = {
  target: T;
};

export type FormEvent<T = EventTarget> = {
  preventDefault: () => void;
  currentTarget: T;
};

type IUploadConstraits = {
  fileTypes: string[];
  maxUploadSize: number;
};

export type UploadsConfig = {
  imgUploadSizeAndTypes: IUploadConstraits[];
  fileUploadSizeAndTypes: IUploadConstraits[];
  isImageUploadAllowed: boolean;
  isSpeechToTextEnabled: boolean;
  isFileUploadAllowed: boolean;
};

type FilePreviewData = string | ArrayBuffer;

type FilePreview = {
  data: FilePreviewData;
  mime: string;
  name: string;
  preview: string;
  type: string;
};

type messageType = 'apiMessage' | 'userMessage' | 'usermessagewaiting' | 'leadCaptureMessage';

export type IAgentReasoning = {
  agentName?: string;
  messages?: string[];
  usedTools?: any[];
  artifacts?: FileUpload[];
  sourceDocuments?: any[];
  instructions?: string;
  nextAgent?: string;
};

export type IAction = {
  id?: string;
  elements?: Array<{
    type: string;
    label: string;
  }>;
  mapping?: {
    approve: string;
    reject: string;
    toolCalls: any[];
  };
};

export type FileUpload = Omit<FilePreview, 'preview'>;

export type MessageType = {
  messageId?: string;
  message: string;
  type: messageType;
  sourceDocuments?: any;
  fileAnnotations?: any;
  fileUploads?: Partial<FileUpload>[];
  artifacts?: Partial<FileUpload>[];
  agentReasoning?: IAgentReasoning[];
  usedTools?: any[];
  action?: IAction | null;
  rating?: FeedbackRatingType;
  id?: string;
};

type observerConfigType = (accessor: string | boolean | object | MessageType[]) => void;
export type observersConfigType = Record<'observeUserInput' | 'observeLoading' | 'observeMessages', observerConfigType>;

export type BotProps = {
  chatflowid: string;
  apiHost?: string;
  onRequest?: (request: RequestInit) => Promise<void>;
  chatflowConfig?: Record<string, unknown>;
  welcomeMessage?: string;
  errorMessage?: string;
  botMessage?: BotMessageTheme;
  userMessage?: UserMessageTheme;
  textInput?: TextInputTheme;
  feedback?: FeedbackTheme;
  poweredByTextColor?: string;
  badgeBackgroundColor?: string;
  bubbleBackgroundColor?: string;
  bubbleTextColor?: string;
  showTitle?: boolean;
  showAgentMessages?: boolean;
  title?: string;
  titleAvatarSrc?: string;
  fontSize?: number;
  isFullPage?: boolean;
  footer?: FooterTheme;
  sourceDocsTitle?: string;
  observersConfig?: observersConfigType;
  starterPrompts?: string[];
  starterPromptFontSize?: number;
  clearChatOnReload?: boolean;
  disclaimer?: DisclaimerPopUpTheme;
  vwRetailerId?: string;
};

export type LeadsConfig = {
  status: boolean;
  title?: string;
  name?: boolean;
  email?: boolean;
  phone?: boolean;
  successMessage?: string;
};

const defaultWelcomeMessage = 'Hi there! How can I help?';

/*const sourceDocuments = [
    {
        "pageContent": "I know some are talking about “living with COVID-19”. Tonight – I say that we will never just accept living with COVID-19. \r\n\r\nWe will continue to combat the virus as we do other diseases. And because this is a virus that mutates and spreads, we will stay on guard. \r\n\r\nHere are four common sense steps as we move forward safely.  \r\n\r\nFirst, stay protected with vaccines and treatments. We know how incredibly effective vaccines are. If you’re vaccinated and boosted you have the highest degree of protection. \r\n\r\nWe will never give up on vaccinating more Americans. Now, I know parents with kids under 5 are eager to see a vaccine authorized for their children. \r\n\r\nThe scientists are working hard to get that done and we’ll be ready with plenty of vaccines when they do. \r\n\r\nWe’re also ready with anti-viral treatments. If you get COVID-19, the Pfizer pill reduces your chances of ending up in the hospital by 90%.",
        "metadata": {
          "source": "blob",
          "blobType": "",
          "loc": {
            "lines": {
              "from": 450,
              "to": 462
            }
          }
        }
    },
    {
        "pageContent": "sistance,  and  polishing  [65].  For  instance,  AI  tools  generate\nsuggestions based on inputting keywords or topics. The tools\nanalyze  search  data,  trending  topics,  and  popular  queries  to\ncreate  fresh  content.  What’s  more,  AIGC  assists  in  writing\narticles and posting blogs on specific topics. While these tools\nmay not be able to produce high-quality content by themselves,\nthey can provide a starting point for a writer struggling with\nwriter’s block.\nH.  Cons of AIGC\nOne of the main concerns among the public is the potential\nlack  of  creativity  and  human  touch  in  AIGC.  In  addition,\nAIGC sometimes lacks a nuanced understanding of language\nand context, which may lead to inaccuracies and misinterpre-\ntations. There are also concerns about the ethics and legality\nof using AIGC, particularly when it results in issues such as\ncopyright  infringement  and  data  privacy.  In  this  section,  we\nwill discuss some of the disadvantages of AIGC (Table IV).",
        "metadata": {
          "source": "blob",
          "blobType": "",
          "pdf": {
            "version": "1.10.100",
            "info": {
              "PDFFormatVersion": "1.5",
              "IsAcroFormPresent": false,
              "IsXFAPresent": false,
              "Title": "",
              "Author": "",
              "Subject": "",
              "Keywords": "",
              "Creator": "LaTeX with hyperref",
              "Producer": "pdfTeX-1.40.21",
              "CreationDate": "D:20230414003603Z",
              "ModDate": "D:20230414003603Z",
              "Trapped": {
                "name": "False"
              }
            },
            "metadata": null,
            "totalPages": 17
          },
          "loc": {
            "pageNumber": 8,
            "lines": {
              "from": 301,
              "to": 317
            }
          }
        }
    },
    {
        "pageContent": "Main article: Views of Elon Musk",
        "metadata": {
          "source": "https://en.wikipedia.org/wiki/Elon_Musk",
          "loc": {
            "lines": {
              "from": 2409,
              "to": 2409
            }
          }
        }
    },
    {
        "pageContent": "First Name: John\nLast Name: Doe\nAddress: 120 jefferson st.\nStates: Riverside\nCode: NJ\nPostal: 8075",
        "metadata": {
          "source": "blob",
          "blobType": "",
          "line": 1,
          "loc": {
            "lines": {
              "from": 1,
              "to": 6
            }
          }
        }
    },
]*/

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#303235';

export const Bot = (botProps: BotProps & { class?: string }) => {
  // set a default value for showTitle if not set and merge with other props
  const props = mergeProps({ showTitle: true }, botProps);
  let chatContainer: HTMLDivElement | undefined;
  let bottomSpacer: HTMLDivElement | undefined;
  let botContainer: HTMLDivElement | undefined;

  const [userInput, setUserInput] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [sourcePopupOpen, setSourcePopupOpen] = createSignal(false);
  const [sourcePopupSrc, setSourcePopupSrc] = createSignal({});
  const [messages, setMessages] = createSignal<MessageType[]>(
    [
      {
        message: props.welcomeMessage ?? defaultWelcomeMessage,
        type: 'apiMessage',
      },
    ],
    { equals: false },
  );

  const [isChatFlowAvailableToStream, setIsChatFlowAvailableToStream] = createSignal(false);
  const [chatId, setChatId] = createSignal(
    (props.chatflowConfig?.vars as any)?.customerId ? `${(props.chatflowConfig?.vars as any).customerId.toString()}+${uuidv4()}` : uuidv4(),
  );
  const [isMessageStopping, setIsMessageStopping] = createSignal(false);
  const [starterPrompts, setStarterPrompts] = createSignal<string[]>([], { equals: false });
  const [chatFeedbackStatus, setChatFeedbackStatus] = createSignal<boolean>(false);
  const [uploadsConfig, setUploadsConfig] = createSignal<UploadsConfig>();
  const [leadsConfig, setLeadsConfig] = createSignal<LeadsConfig>();
  const [isLeadSaved, setIsLeadSaved] = createSignal(false);
  const [leadEmail, setLeadEmail] = createSignal('');
  const [disclaimerPopupOpen, setDisclaimerPopupOpen] = createSignal(false);

  // drag & drop file input
  // TODO: fix this type
  const [previews, setPreviews] = createSignal<FilePreview[]>([]);

  // audio recording
  const [elapsedTime, setElapsedTime] = createSignal('00:00');
  const [isRecording, setIsRecording] = createSignal(false);
  const [recordingNotSupported, setRecordingNotSupported] = createSignal(false);
  const [isLoadingRecording, setIsLoadingRecording] = createSignal(false);

  // drag & drop
  const [isDragActive, setIsDragActive] = createSignal(false);
  const [uploadedFiles, setUploadedFiles] = createSignal<File[]>([]);

  onMount(() => {
    if (botProps?.observersConfig) {
      const { observeUserInput, observeLoading, observeMessages } = botProps.observersConfig;
      typeof observeUserInput === 'function' &&
        // eslint-disable-next-line solid/reactivity
        createMemo(() => {
          observeUserInput(userInput());
        });
      typeof observeLoading === 'function' &&
        // eslint-disable-next-line solid/reactivity
        createMemo(() => {
          observeLoading(loading());
        });
      typeof observeMessages === 'function' &&
        // eslint-disable-next-line solid/reactivity
        createMemo(() => {
          observeMessages(messages());
        });
    }

    if (!bottomSpacer) return;
    setTimeout(() => {
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
    }, 50);
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
    }, 50);
  };

  /**
   * Add each chat message into localStorage
   */
  const addChatMessage = (allMessage: MessageType[]) => {
    const messages = allMessage.map((item) => {
      if (item.fileUploads) {
        const fileUploads = item?.fileUploads.map((file) => ({
          type: file.type,
          name: file.name,
          mime: file.mime,
        }));
        return { ...item, fileUploads };
      }
      return item;
    });
    setLocalStorageChatflow(props.chatflowid, chatId(), { chatHistory: messages });
  };

  // Define the audioRef
  let audioRef: HTMLAudioElement | undefined;
  // CDN link for default receive sound
  const defaultReceiveSound = 'https://cdn.jsdelivr.net/gh/FlowiseAI/FlowiseChatEmbed@latest/src/assets/receive_message.mp3';
  const playReceiveSound = () => {
    if (props.textInput?.receiveMessageSound) {
      let audioSrc = defaultReceiveSound;
      if (props.textInput?.receiveSoundLocation) {
        audioSrc = props.textInput?.receiveSoundLocation;
      }
      audioRef = new Audio(audioSrc);
      audioRef.play();
    }
  };

  let hasSoundPlayed = false;

  const updateLastMessage = (text: string) => {
    setMessages((prevMessages) => {
      const allMessages = [...cloneDeep(prevMessages)];
      if (allMessages[allMessages.length - 1].type === 'userMessage') return allMessages;
      if (!text) return allMessages;
      allMessages[allMessages.length - 1].message += text;
      allMessages[allMessages.length - 1].rating = undefined;
      if (!hasSoundPlayed) {
        playReceiveSound();
        hasSoundPlayed = true;
      }
      addChatMessage(allMessages);
      return allMessages;
    });
  };

  const updateErrorMessage = (errorMessage: string) => {
    setMessages((prevMessages) => {
      const allMessages = [...cloneDeep(prevMessages)];
      allMessages.push({ message: errorMessage, type: 'apiMessage' });
      addChatMessage(allMessages);
      return allMessages;
    });
  };

  const updateLastMessageSourceDocuments = (sourceDocuments: any) => {
    setMessages((data) => {
      const updated = data.map((item, i) => {
        if (i === data.length - 1) {
          return { ...item, sourceDocuments };
        }
        return item;
      });
      addChatMessage(updated);
      return [...updated];
    });
  };

  const updateLastMessageUsedTools = (usedTools: any[]) => {
    setMessages((prevMessages) => {
      const allMessages = [...cloneDeep(prevMessages)];
      if (allMessages[allMessages.length - 1].type === 'userMessage') return allMessages;
      allMessages[allMessages.length - 1].usedTools = usedTools;
      addChatMessage(allMessages);
      return allMessages;
    });
  };

  const updateLastMessageFileAnnotations = (fileAnnotations: any) => {
    setMessages((prevMessages) => {
      const allMessages = [...cloneDeep(prevMessages)];
      if (allMessages[allMessages.length - 1].type === 'userMessage') return allMessages;
      allMessages[allMessages.length - 1].fileAnnotations = fileAnnotations;
      addChatMessage(allMessages);
      return allMessages;
    });
  };

  const updateLastMessageAgentReasoning = (agentReasoning: string | IAgentReasoning[]) => {
    setMessages((data) => {
      const updated = data.map((item, i) => {
        if (i === data.length - 1) {
          return { ...item, agentReasoning: typeof agentReasoning === 'string' ? JSON.parse(agentReasoning) : agentReasoning };
        }
        return item;
      });
      addChatMessage(updated);
      return [...updated];
    });
  };

  const updateLastMessageArtifacts = (artifacts: FileUpload[]) => {
    setMessages((prevMessages) => {
      const allMessages = [...cloneDeep(prevMessages)];
      if (allMessages[allMessages.length - 1].type === 'userMessage') return allMessages;
      allMessages[allMessages.length - 1].artifacts = artifacts;
      addChatMessage(allMessages);
      return allMessages;
    });
  };

  const updateLastMessageAction = (action: IAction) => {
    setMessages((data) => {
      const updated = data.map((item, i) => {
        if (i === data.length - 1) {
          return { ...item, action: typeof action === 'string' ? JSON.parse(action) : action };
        }
        return item;
      });
      addChatMessage(updated);
      return [...updated];
    });
  };

  const clearPreviews = () => {
    // Revoke the data uris to avoid memory leaks
    previews().forEach((file) => URL.revokeObjectURL(file.preview));
    setPreviews([]);
  };

  // Handle errors
  const handleError = (message = 'Oops! There seems to be an error. Please try again.') => {
    setMessages((prevMessages) => {
      const messages: MessageType[] = [...prevMessages, { message: props.errorMessage || message, type: 'apiMessage' }];
      addChatMessage(messages);
      return messages;
    });
    setLoading(false);
    setUserInput('');
    setUploadedFiles([]);
    scrollToBottom();
  };

  const handleDisclaimerAccept = () => {
    setDisclaimerPopupOpen(false); // Close the disclaimer popup
    setCookie('chatbotDisclaimer', 'true', 365); // Disclaimer accepted
  };

  const promptClick = (prompt: string) => {
    handleSubmit(prompt);
  };

  const updateMetadata = (data: any, input: string) => {
    if (data.chatId) {
      setChatId(data.chatId);
    }

    // set message id that is needed for feedback
    if (data.chatMessageId) {
      setMessages((prevMessages) => {
        const allMessages = [...cloneDeep(prevMessages)];
        if (allMessages[allMessages.length - 1].type === 'apiMessage') {
          allMessages[allMessages.length - 1].messageId = data.chatMessageId;
        }
        addChatMessage(allMessages);
        return allMessages;
      });
    }

    if (input === '' && data.question) {
      // the response contains the question even if it was in an audio format
      // so if input is empty but the response contains the question, update the user message to show the question
      setMessages((prevMessages) => {
        const allMessages = [...cloneDeep(prevMessages)];
        if (allMessages[allMessages.length - 2].type === 'apiMessage') return allMessages;
        allMessages[allMessages.length - 2].message = data.question;
        addChatMessage(allMessages);
        return allMessages;
      });
    }
  };

  const fetchResponseFromEventStream = async (chatflowid: string, params: any) => {
    const chatId = params.chatId;
    const input = params.question;
    params.streaming = true;
    fetchEventSource(`${props.apiHost}/api/v1/prediction/${chatflowid}`, {
      openWhenHidden: true,
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json',
      },
      async onmessage(ev) {
        const payload = JSON.parse(ev.data);
        switch (payload.event) {
          case 'start':
            setMessages((prevMessages) => [...prevMessages, { message: '', type: 'apiMessage' }]);
            break;
          case 'token':
            updateLastMessage(payload.data);
            break;
          case 'sourceDocuments':
            updateLastMessageSourceDocuments(payload.data);
            break;
          case 'usedTools':
            updateLastMessageUsedTools(payload.data);
            break;
          case 'fileAnnotations':
            updateLastMessageFileAnnotations(payload.data);
            break;
          case 'agentReasoning':
            updateLastMessageAgentReasoning(payload.data);
            break;
          case 'action':
            updateLastMessageAction(payload.data);
            break;
          case 'artifacts':
            updateLastMessageArtifacts(payload.data);
            break;
          case 'metadata':
            updateMetadata(payload.data, input);
            break;
          case 'error':
            updateErrorMessage(payload.data);
            break;
          case 'abort':
            abortMessage();
            closeResponse();
            break;
          case 'end':
            setLocalStorageChatflow(chatflowid, chatId);
            closeResponse();
            break;
        }
      },
      async onclose() {
        closeResponse();
      },
      onerror(err) {
        console.error('EventSource Error: ', err);
        closeResponse();
      },
    });
  };

  const closeResponse = () => {
    setLoading(false);
    setUserInput('');
    setUploadedFiles([]);
    hasSoundPlayed = false;
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const abortMessage = () => {
    setIsMessageStopping(false);
    setMessages((prevMessages) => {
      const allMessages = [...cloneDeep(prevMessages)];
      if (allMessages[allMessages.length - 1].type === 'userMessage') return allMessages;
      const lastAgentReasoning = allMessages[allMessages.length - 1].agentReasoning;
      if (lastAgentReasoning && lastAgentReasoning.length > 0) {
        allMessages[allMessages.length - 1].agentReasoning = lastAgentReasoning.filter((reasoning) => !reasoning.nextAgent);
      }
      return allMessages;
    });
  };

  // Handle form submission
  const handleSubmit = async (value: string, action?: IAction | undefined | null) => {
    if (value.trim() === '') {
      const containsFile = previews().filter((item) => !item.mime.startsWith('image') && item.type !== 'audio').length > 0;
      if (!previews().length || (previews().length && containsFile)) {
        return;
      }
    }

    setLoading(true);
    scrollToBottom();

    const uploads = previews().map((item) => {
      return {
        data: item.data,
        type: item.type,
        name: item.name,
        mime: item.mime,
      };
    });

    clearPreviews();

    setMessages((prevMessages) => {
      const messages: MessageType[] = [...prevMessages, { message: value, type: 'userMessage', fileUploads: uploads }];
      addChatMessage(messages);
      return messages;
    });

    const body: IncomingInput = {
      question: value,
      chatId: chatId(),
      overrideConfig: {
        analytics: {
          langFuse: {
            userId: props.vwRetailerId,
          },
        },
      },
    };

    if (uploads && uploads.length > 0) body.uploads = uploads;

    if (props.chatflowConfig) body.overrideConfig = props.chatflowConfig;

    if (leadEmail()) body.leadEmail = leadEmail();

    if (action) body.action = action;

    if (uploadedFiles().length > 0) {
      const formData = new FormData();
      for (const file of uploadedFiles()) {
        formData.append('files', file);
      }
      formData.append('chatId', chatId());

      const response = await upsertVectorStoreWithFormData({
        chatflowid: props.chatflowid,
        apiHost: props.apiHost,
        formData: formData,
      });

      if (!response.data) {
        setMessages((prevMessages) => [...prevMessages, { message: 'Unable to upload documents', type: 'apiMessage' }]);
      } else {
        // delay for vector store to be updated
        const delay = (delayInms: number) => {
          return new Promise((resolve) => setTimeout(resolve, delayInms));
        };
        await delay(2500); //TODO: check if embeddings can be retrieved using file name as metadata filter
      }
    }

    if (isChatFlowAvailableToStream()) {
      fetchResponseFromEventStream(props.chatflowid, body);
    } else {
      const result = await sendMessageQuery({
        chatflowid: props.chatflowid,
        apiHost: props.apiHost,
        body,
        onRequest: props.onRequest,
      });

      if (result.data) {
        const data = result.data;

        let text = '';
        if (data.text) text = data.text;
        else if (data.json) text = JSON.stringify(data.json, null, 2);
        else text = JSON.stringify(data, null, 2);

        if (data?.chatId) setChatId(data.chatId);

        playReceiveSound();

        setMessages((prevMessages) => {
          const allMessages = [...cloneDeep(prevMessages)];
          const newMessage = {
            message: text,
            id: data?.chatMessageId,
            sourceDocuments: data?.sourceDocuments,
            usedTools: data?.usedTools,
            fileAnnotations: data?.fileAnnotations,
            agentReasoning: data?.agentReasoning,
            action: data?.action,
            artifacts: data?.artifacts,
            type: 'apiMessage' as messageType,
            feedback: null,
          };
          allMessages.push(newMessage);
          addChatMessage(allMessages);
          return allMessages;
        });

        updateMetadata(data, value);

        setLoading(false);
        setUserInput('');
        setUploadedFiles([]);
        scrollToBottom();
      }
      if (result.error) {
        const error = result.error;
        console.error(error);
        if (typeof error === 'object') {
          handleError(`Error: ${error?.message.replaceAll('Error:', ' ')}`);
          return;
        }
        if (typeof error === 'string') {
          handleError(error);
          return;
        }
        handleError();
        return;
      }
    }

    // Update last question to avoid saving base64 data to localStorage
    if (uploads && uploads.length > 0) {
      setMessages((data) => {
        const messages = data.map((item, i) => {
          if (i === data.length - 2 && item.type === 'userMessage') {
            if (item.fileUploads) {
              const fileUploads = item?.fileUploads.map((file) => ({
                type: file.type,
                name: file.name,
                mime: file.mime,
              }));
              return { ...item, fileUploads };
            }
          }
          return item;
        });
        addChatMessage(messages);
        return [...messages];
      });
    }
  };

  const handleActionClick = async (label: string, action: IAction | undefined | null) => {
    setUserInput(label);
    setMessages((data) => {
      const updated = data.map((item, i) => {
        if (i === data.length - 1) {
          return { ...item, action: null };
        }
        return item;
      });
      addChatMessage(updated);
      return [...updated];
    });
    handleSubmit(label, action);
  };

  const clearChat = () => {
    try {
      removeLocalStorageChatHistory(props.chatflowid);
      setChatId(
        (props.chatflowConfig?.vars as any)?.customerId ? `${(props.chatflowConfig?.vars as any).customerId.toString()}+${uuidv4()}` : uuidv4(),
      );
      setUploadedFiles([]);
      const messages: MessageType[] = [
        {
          message: props.welcomeMessage ?? defaultWelcomeMessage,
          type: 'apiMessage',
        },
      ];
      if (leadsConfig()?.status && !getLocalStorageChatflow(props.chatflowid)?.lead) {
        messages.push({ message: '', type: 'leadCaptureMessage' });
      }
      setMessages(messages);
    } catch (error: any) {
      const errorData = error.response.data || `${error.response.status}: ${error.response.statusText}`;
      console.error(`error: ${errorData}`);
    }
  };

  onMount(() => {
    if (props.clearChatOnReload) {
      clearChat();
      window.addEventListener('beforeunload', clearChat);
      return () => {
        window.removeEventListener('beforeunload', clearChat);
      };
    }
  });

  createEffect(() => {
    if (props.starterPrompts && props.starterPrompts.length > 0) {
      const prompts = Object.values(props.starterPrompts).map((prompt) => prompt);

      return setStarterPrompts(prompts.filter((prompt) => prompt !== ''));
    }
  });

  // Auto scroll chat to bottom
  createEffect(() => {
    if (messages()) {
      if (messages().length > 1) {
        setTimeout(() => {
          chatContainer?.scrollTo(0, chatContainer.scrollHeight);
        }, 400);
      }
    }
  });

  createEffect(() => {
    if (props.fontSize && botContainer) botContainer.style.fontSize = `${props.fontSize}px`;
  });

  // eslint-disable-next-line solid/reactivity
  createEffect(async () => {
    if (props.disclaimer) {
      if (getCookie('chatbotDisclaimer') == 'true') {
        setDisclaimerPopupOpen(false);
      } else {
        setDisclaimerPopupOpen(true);
      }
    } else {
      setDisclaimerPopupOpen(false);
    }

    const chatMessage = getLocalStorageChatflow(props.chatflowid);
    if (chatMessage && Object.keys(chatMessage).length) {
      if (chatMessage.chatId) setChatId(chatMessage.chatId);
      const savedLead = chatMessage.lead;
      if (savedLead) {
        setIsLeadSaved(!!savedLead);
        setLeadEmail(savedLead.email);
      }
      const loadedMessages: MessageType[] =
        chatMessage?.chatHistory?.length > 0
          ? chatMessage.chatHistory?.map((message: MessageType) => {
            const chatHistory: MessageType = {
              messageId: message?.messageId,
              message: message.message,
              type: message.type,
              rating: message.rating,
            };
            if (message.sourceDocuments) chatHistory.sourceDocuments = message.sourceDocuments;
            if (message.fileAnnotations) chatHistory.fileAnnotations = message.fileAnnotations;
            if (message.fileUploads) chatHistory.fileUploads = message.fileUploads;
            if (message.agentReasoning) chatHistory.agentReasoning = message.agentReasoning;
            if (message.action) chatHistory.action = message.action;
            if (message.artifacts) chatHistory.artifacts = message.artifacts;
            return chatHistory;
          })
          : [{ message: props.welcomeMessage ?? defaultWelcomeMessage, type: 'apiMessage' }];

      const filteredMessages = loadedMessages.filter((message) => message.type !== 'leadCaptureMessage');
      setMessages([...filteredMessages]);
    }

    // Determine if particular chatflow is available for streaming
    const { data } = await isStreamAvailableQuery({
      chatflowid: props.chatflowid,
      apiHost: props.apiHost,
      onRequest: props.onRequest,
    });

    if (data) {
      setIsChatFlowAvailableToStream(data?.isStreaming ?? false);
    }

    // Get the chatbotConfig
    const result = await getChatbotConfig({
      chatflowid: props.chatflowid,
      apiHost: props.apiHost,
      onRequest: props.onRequest,
    });

    if (result.data) {
      const chatbotConfig = result.data;
      if ((!props.starterPrompts || props.starterPrompts?.length === 0) && chatbotConfig.starterPrompts) {
        const prompts: string[] = [];
        Object.getOwnPropertyNames(chatbotConfig.starterPrompts).forEach((key) => {
          prompts.push(chatbotConfig.starterPrompts[key].prompt);
        });
        setStarterPrompts(prompts.filter((prompt) => prompt !== ''));
      }
      if (chatbotConfig.chatFeedback) {
        const chatFeedbackStatus = chatbotConfig.chatFeedback.status;
        setChatFeedbackStatus(chatFeedbackStatus);
      }
      if (chatbotConfig.uploads) {
        setUploadsConfig(chatbotConfig.uploads);
      }
      if (chatbotConfig.leads) {
        setLeadsConfig(chatbotConfig.leads);
        if (chatbotConfig.leads?.status && !getLocalStorageChatflow(props.chatflowid)?.lead) {
          setMessages((prevMessages) => [...prevMessages, { message: '', type: 'leadCaptureMessage' }]);
        }
      }
    }

    // eslint-disable-next-line solid/reactivity
    return () => {
      setUserInput('');
      setUploadedFiles([]);
      setLoading(false);
      setMessages([
        {
          message: props.welcomeMessage ?? defaultWelcomeMessage,
          type: 'apiMessage',
        },
      ]);
    };
  });

  const addRecordingToPreviews = (blob: Blob) => {
    let mimeType = '';
    const pos = blob.type.indexOf(';');
    if (pos === -1) {
      mimeType = blob.type;
    } else {
      mimeType = blob.type.substring(0, pos);
    }

    // read blob and add to previews
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result as FilePreviewData;
      const upload: FilePreview = {
        data: base64data,
        preview: '../assets/wave-sound.jpg',
        type: 'audio',
        name: `audio_${Date.now()}.wav`,
        mime: mimeType,
      };
      setPreviews((prevPreviews) => [...prevPreviews, upload]);
    };
  };

  const isFileAllowedForUpload = (file: File) => {
    let acceptFile = false;
    if (uploadsConfig() && uploadsConfig()?.isImageUploadAllowed && uploadsConfig()?.imgUploadSizeAndTypes) {
      const fileType = file.type;
      const sizeInMB = file.size / 1024 / 1024;
      uploadsConfig()?.imgUploadSizeAndTypes.map((allowed) => {
        if (allowed.fileTypes.includes(fileType) && sizeInMB <= allowed.maxUploadSize) {
          acceptFile = true;
        }
      });
    }
    if (uploadsConfig() && uploadsConfig()?.isFileUploadAllowed && uploadsConfig()?.fileUploadSizeAndTypes) {
      const fileExt = file.name.split('.').pop();
      if (fileExt) {
        uploadsConfig()?.fileUploadSizeAndTypes.map((allowed) => {
          if (allowed.fileTypes.length === 1 && allowed.fileTypes[0] === '*') {
            acceptFile = true;
          } else if (allowed.fileTypes.includes(`.${fileExt}`)) {
            acceptFile = true;
          }
        });
      }
    }
    if (!acceptFile) {
      alert(`Cannot upload file. Kindly check the allowed file types and maximum allowed size.`);
    }
    return acceptFile;
  };

  const handleFileChange = async (event: FileEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const filesList = [];
    const uploadedFiles = [];
    for (const file of files) {
      if (isFileAllowedForUpload(file) === false) {
        return;
      }
      // Only add files
      if (
        !uploadsConfig()
          ?.imgUploadSizeAndTypes.map((allowed) => allowed.fileTypes)
          .join(',')
          .includes(file.type)
      ) {
        uploadedFiles.push(file);
      }
      const reader = new FileReader();
      const { name } = file;
      filesList.push(
        new Promise((resolve) => {
          reader.onload = (evt) => {
            if (!evt?.target?.result) {
              return;
            }
            const { result } = evt.target;
            resolve({
              data: result,
              preview: URL.createObjectURL(file),
              type: 'file',
              name: name,
              mime: file.type,
            });
          };
          reader.readAsDataURL(file);
        }),
      );
    }

    const newFiles = await Promise.all(filesList);
    setUploadedFiles(uploadedFiles);
    setPreviews((prevPreviews) => [...prevPreviews, ...(newFiles as FilePreview[])]);
  };

  const handleDrag = (e: DragEvent) => {
    if (uploadsConfig()?.isImageUploadAllowed || uploadsConfig()?.isFileUploadAllowed) {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragActive(true);
      } else if (e.type === 'dragleave') {
        setIsDragActive(false);
      }
    }
  };

  const handleDrop = async (e: InputEvent | DragEvent) => {
    if (!uploadsConfig()?.isImageUploadAllowed && !uploadsConfig()?.isFileUploadAllowed) {
      return;
    }
    e.preventDefault();
    setIsDragActive(false);
    const files = [];
    const uploadedFiles = [];
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      for (const file of e.dataTransfer.files) {
        if (isFileAllowedForUpload(file) === false) {
          return;
        }
        // Only add files
        if (
          !uploadsConfig()
            ?.imgUploadSizeAndTypes.map((allowed) => allowed.fileTypes)
            .join(',')
            .includes(file.type)
        ) {
          uploadedFiles.push(file);
        }
        const reader = new FileReader();
        const { name } = file;
        files.push(
          new Promise((resolve) => {
            reader.onload = (evt) => {
              if (!evt?.target?.result) {
                return;
              }
              const { result } = evt.target;
              let previewUrl;
              if (file.type.startsWith('audio/')) {
                previewUrl = '../assets/wave-sound.jpg';
              } else if (file.type.startsWith('image/')) {
                previewUrl = URL.createObjectURL(file);
              }
              resolve({
                data: result,
                preview: previewUrl,
                type: 'file',
                name: name,
                mime: file.type,
              });
            };
            reader.readAsDataURL(file);
          }),
        );
      }

      const newFiles = await Promise.all(files);
      setUploadedFiles(uploadedFiles);
      setPreviews((prevPreviews) => [...prevPreviews, ...(newFiles as FilePreview[])]);
    }

    if (e.dataTransfer && e.dataTransfer.items) {
      for (const item of e.dataTransfer.items) {
        if (item.kind === 'string' && item.type.match('^text/uri-list')) {
          item.getAsString((s: string) => {
            const upload: FilePreview = {
              data: s,
              preview: s,
              type: 'url',
              name: s.substring(s.lastIndexOf('/') + 1),
              mime: '',
            };
            setPreviews((prevPreviews) => [...prevPreviews, upload]);
          });
        } else if (item.kind === 'string' && item.type.match('^text/html')) {
          item.getAsString((s: string) => {
            if (s.indexOf('href') === -1) return;
            //extract href
            const start = s.substring(s.indexOf('href') + 6);
            const hrefStr = start.substring(0, start.indexOf('"'));

            const upload: FilePreview = {
              data: hrefStr,
              preview: hrefStr,
              type: 'url',
              name: hrefStr.substring(hrefStr.lastIndexOf('/') + 1),
              mime: '',
            };
            setPreviews((prevPreviews) => [...prevPreviews, upload]);
          });
        }
      }
    }
  };

  const handleDeletePreview = (itemToDelete: FilePreview) => {
    if (itemToDelete.type === 'file') {
      URL.revokeObjectURL(itemToDelete.preview); // Clean up for file
    }
    setPreviews(previews().filter((item) => item !== itemToDelete));
  };

  const onMicrophoneClicked = () => {
    setIsRecording(true);
    startAudioRecording(setIsRecording, setRecordingNotSupported, setElapsedTime);
  };

  const onRecordingCancelled = () => {
    if (!recordingNotSupported) cancelAudioRecording();
    setIsRecording(false);
    setRecordingNotSupported(false);
  };

  const onRecordingStopped = async () => {
    setIsLoadingRecording(true);
    stopAudioRecording(addRecordingToPreviews);
  };

  const getInputDisabled = (): boolean => {
    const messagesArray = messages();
    const disabled =
      loading() ||
      !props.chatflowid ||
      (leadsConfig()?.status && !isLeadSaved()) ||
      (messagesArray[messagesArray.length - 1].action && Object.keys(messagesArray[messagesArray.length - 1].action as any).length > 0);
    if (disabled) {
      return true;
    }
    return false;
  };

  createEffect(
    // listen for changes in previews
    on(previews, (uploads) => {
      // wait for audio recording to load and then send
      const containsAudio = uploads.filter((item) => item.type === 'audio').length > 0;
      if (uploads.length >= 1 && containsAudio) {
        setIsRecording(false);
        setRecordingNotSupported(false);
        promptClick('');
      }

      return () => {
        setPreviews([]);
      };
    }),
  );

  const previewDisplay = (item: FilePreview) => {
    if (item.mime.startsWith('image/')) {
      return (
        <button
          class="group w-12 h-12 flex items-center justify-center relative rounded-[10px] overflow-hidden transition-colors duration-200"
          onClick={() => handleDeletePreview(item)}
        >
          <img class="w-full h-full bg-cover" src={item.data as string} />
          <span class="absolute hidden group-hover:flex items-center justify-center z-10 w-full h-full top-0 left-0 bg-black/10 rounded-[10px] transition-colors duration-200">
            <TrashIcon />
          </span>
        </button>
      );
    } else if (item.mime.startsWith('audio/')) {
      return (
        <div
          class={`inline-flex basis-auto flex-grow-0 flex-shrink-0 justify-between items-center rounded-xl h-12 p-1 mr-1 bg-gray-500`}
          style={{
            width: `${chatContainer ? (botProps.isFullPage ? chatContainer?.offsetWidth / 4 : chatContainer?.offsetWidth / 2) : '200'}px`,
          }}
        >
          <audio class="block bg-cover bg-center w-full h-full rounded-none text-transparent" controls src={item.data as string} />
          <button class="w-7 h-7 flex items-center justify-center bg-transparent p-1" onClick={() => handleDeletePreview(item)}>
            <TrashIcon color="white" />
          </button>
        </div>
      );
    } else {
      return <FilePreview item={item} onDelete={() => handleDeletePreview(item)} />;
    }
  };

  return (
    <>
      <div
        ref={botContainer}
        class={'relative flex w-full h-full text-base overflow-hidden bg-cover bg-center flex-col items-center chatbot-container ' + props.class}
        style={{ 'background-color': '#F3F4F5'}}
        onDragEnter={handleDrag}
      >
        {isDragActive() && (
          <div
            class="absolute top-0 left-0 bottom-0 right-0 w-full h-full z-50"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragEnd={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          />
        )}
        {isDragActive() && (uploadsConfig()?.isImageUploadAllowed || uploadsConfig()?.isFileUploadAllowed) && (
          <div
            class="absolute top-0 left-0 bottom-0 right-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white z-40 gap-2 border-2 border-dashed"
            style={{ 'border-color': props.bubbleBackgroundColor }}
          >
            <h2 class="text-xl font-semibold">Drop here to upload</h2>
            <For each={[...(uploadsConfig()?.imgUploadSizeAndTypes || []), ...(uploadsConfig()?.fileUploadSizeAndTypes || [])]}>
              {(allowed) => {
                return (
                  <>
                    <span>{allowed.fileTypes?.join(', ')}</span>
                    {allowed.maxUploadSize && <span>Max Allowed Size: {allowed.maxUploadSize} MB</span>}
                  </>
                );
              }}
            </For>
          </div>
        )}

        <div
          class="flex flex-row h-[90] items-center w-full absolute top-0 left-0 z-10 bg-white"
          style={{
            'border-top-left-radius': props.isFullPage ? '0px' : '6px',
            'border-top-right-radius': props.isFullPage ? '0px' : '6px',
            'box-shadow': '0px 8px 32px 0px rgba(0, 0, 0, 0.10)',
            'color': '#000E26',
            'font-family': 'vw-head',
            'font-size': '24px',
            'padding': '13px',
            'font-weight': '300'
          }}
        >
          <div style={{'padding-left' : '50px'}}>
            <svg width="71" height="64" viewBox="0 0 71 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="logo" clip-path="url(#clip0_226_3390)">
                <path id="Vector" d="M25.7714 57.1817C25.7366 57.178 25.7017 57.1689 25.6706 57.147C25.6137 57.1051 25.5881 57.0376 25.5936 56.972C25.5569 56.9665 25.5221 56.9555 25.4927 56.93C25.4927 56.93 25.4927 56.9282 25.4909 56.9264C25.4176 56.9665 25.3259 56.961 25.2581 56.9027C25.2489 56.8954 25.2434 56.8844 25.2361 56.8753C25.2343 56.8808 25.2288 56.8862 25.2251 56.8935C25.2618 56.9391 25.2746 56.9957 25.2654 57.0504C25.4249 57.1087 25.5826 57.1671 25.7439 57.2236C25.7476 57.2181 25.7476 57.2108 25.7512 57.2054C25.7567 57.1963 25.7641 57.1926 25.7714 57.1853V57.1817Z" fill="#2BAEE4" />
                <path id="Vector_2" d="M56.5145 45.9212C56.5456 45.8665 56.597 45.8336 56.6538 45.8245C56.8463 45.4963 57.0314 45.1644 57.2111 44.8288C57.1928 44.8197 57.1726 44.8106 57.1561 44.796C57.0736 44.7212 57.0663 44.5936 57.1414 44.5115C57.2074 44.4386 57.3138 44.4295 57.3944 44.4769C57.5411 44.1906 57.6804 43.9006 57.8161 43.6089C57.7519 43.5213 57.7666 43.3973 57.8546 43.3299C57.8857 43.3062 57.9242 43.2952 57.9609 43.2916C59.4 40.0803 60.1993 36.5243 60.1993 32.7823C60.1993 28.4514 59.1268 24.3702 57.2331 20.7832C57.1414 20.8398 57.0204 20.8161 56.9599 20.7249C56.8976 20.6319 56.9214 20.5079 57.0149 20.4459C57.0241 20.4386 57.0369 20.4368 57.0479 20.4331C56.8939 20.1523 56.7326 19.8733 56.5695 19.5998C56.5511 19.6399 56.5236 19.6763 56.4796 19.6964C56.3806 19.7475 56.2578 19.7092 56.2065 19.6089C56.1552 19.5104 56.1937 19.3882 56.2945 19.3372C56.3293 19.3189 56.366 19.3171 56.4008 19.3189C56.234 19.0454 56.0598 18.7773 55.882 18.5111C55.8728 18.5166 55.8637 18.5257 55.8527 18.5293C55.7482 18.5713 55.6309 18.5202 55.5887 18.4163C55.5539 18.3287 55.5869 18.2357 55.6584 18.1828C55.2715 17.6212 54.8609 17.0759 54.4319 16.5471C54.3256 16.558 54.2284 16.4869 54.2119 16.3812C54.2064 16.3483 54.2119 16.3173 54.2211 16.2881C54.0433 16.0766 53.8636 15.8669 53.6785 15.6608C53.6491 15.7338 53.5776 15.7848 53.4933 15.7867C53.3815 15.7867 53.2898 15.6991 53.288 15.5879C53.288 15.4931 53.3522 15.4165 53.4402 15.3928C51.2274 12.9729 48.5583 10.9743 45.5683 9.52635C45.5939 9.6303 45.5371 9.73606 45.4326 9.76889C45.3263 9.80171 45.2126 9.74153 45.1796 9.63577C45.1503 9.53729 45.1998 9.437 45.2915 9.39688C45.033 9.27652 44.7727 9.15799 44.5105 9.04675C44.4812 9.07593 44.4445 9.09964 44.3987 9.10511C44.2887 9.12152 44.186 9.04493 44.1695 8.93369C44.1695 8.92275 44.1695 8.91363 44.1695 8.90269C43.5224 8.63463 42.8624 8.39391 42.1915 8.17873C42.1475 8.20791 42.0925 8.22068 42.0375 8.20973C41.9678 8.19515 41.9165 8.14591 41.8927 8.08391C41.075 7.83226 40.2409 7.62072 39.3921 7.44931C39.3866 7.44931 39.383 7.44748 39.3775 7.44566C37.7092 7.11012 35.9823 6.93506 34.2133 6.93506C19.8628 6.93506 8.23096 18.5074 8.23096 32.7805C8.23096 34.6096 8.42345 36.393 8.78642 38.1145C10.9845 39.3253 13.5161 40.6839 15.3219 41.5719C14.7719 39.5952 14.2989 37.4397 15.4392 35.4338C16.4053 33.7361 18.31 32.5216 21.2725 31.721L29.0857 29.6075C29.1297 26.6752 31.0345 24.0292 33.9383 23.2451C33.9566 23.2396 33.9695 23.2359 33.9878 23.2323L43.1374 20.7577L43.7406 22.9606L49.847 21.3084C50.5345 21.137 51.2384 21.54 51.4236 22.222C51.6106 22.9041 51.2091 23.6061 50.5272 23.7994L50.5345 23.8067L44.428 25.4589L45.4601 29.2337L51.5648 27.5815C52.2522 27.4101 52.9562 27.8131 53.1432 28.4951C53.3302 29.1771 52.9287 29.8792 52.2467 30.0725L46.1402 31.7247L46.7434 33.9275L37.5937 36.4021C37.5937 36.4021 37.5626 36.4112 37.5442 36.4149C34.6404 37.2008 31.6523 35.8788 30.1197 33.3677L22.3065 35.4812C20.4677 35.9791 19.1057 36.5498 18.8692 37.3413C18.5777 38.3059 18.8197 39.6864 19.2761 41.2692C19.4906 42.0169 19.7161 42.7883 19.8774 43.5925C20.0681 44.5389 19.7455 45.4251 19.0067 45.9576C17.6097 46.9697 15.936 46.4208 10.5885 43.5469C11.9707 46.543 13.914 49.2273 16.2807 51.4757C16.3448 51.4247 16.4346 51.4137 16.5098 51.4575C16.5428 51.4757 16.5648 51.5049 16.5813 51.5359C16.6308 51.5195 16.6858 51.5232 16.7353 51.5469C16.8178 51.5888 16.8563 51.6763 16.8398 51.7621C16.8985 51.8186 16.9223 51.9061 16.8893 51.9845C16.8838 51.9955 16.8746 52.0046 16.8691 52.0155C16.9974 52.1286 17.1239 52.2435 17.2541 52.3547C17.2926 52.3219 17.3439 52.3018 17.3989 52.3055C17.5107 52.3128 17.5951 52.4076 17.5896 52.5188C17.5877 52.5535 17.5749 52.5827 17.5584 52.61C19.7235 54.4117 22.1855 55.8705 24.8657 56.899C24.8253 56.8261 24.8327 56.7331 24.8913 56.6674C24.9665 56.5854 25.0948 56.5799 25.1773 56.6547C25.1865 56.662 25.1901 56.6729 25.1975 56.6802C25.2066 56.6565 25.2195 56.6328 25.236 56.6127C25.3093 56.5289 25.4358 56.5216 25.5201 56.5945C25.5916 56.5544 25.6833 56.5599 25.7493 56.6146C25.8006 56.6583 25.8208 56.7203 25.8171 56.7823C25.8501 56.7878 25.8813 56.7969 25.9088 56.817C25.9986 56.8826 26.0169 57.0103 25.9509 57.0996C25.9491 57.1015 25.9454 57.1033 25.9436 57.1051C25.9729 57.1088 26.0004 57.116 26.0261 57.1325C26.0976 57.178 26.1306 57.2601 26.1177 57.3385C26.2039 57.3659 26.2901 57.3951 26.3781 57.4224C26.4092 57.4224 26.4422 57.4261 26.4716 57.4406C26.4826 57.4461 26.4881 57.4552 26.4972 57.4607C26.5009 57.4607 26.5046 57.4625 26.5082 57.4644C26.5669 57.4188 26.6475 57.4042 26.719 57.4388C26.7722 57.4644 26.807 57.5081 26.8235 57.5592C26.8309 57.561 26.84 57.5628 26.8474 57.5665C26.8749 57.5665 26.9024 57.5701 26.928 57.5811C26.9354 57.5847 26.9409 57.5902 26.9482 57.5938C29.2544 58.2612 31.6889 58.6205 34.2114 58.6205C35.766 58.6205 37.2876 58.4837 38.767 58.2248C38.7945 58.192 38.8312 58.1646 38.877 58.1537C38.9283 58.1427 38.9778 58.1537 39.02 58.1774C39.3646 58.1135 39.7056 58.0442 40.0448 57.9658C40.0741 57.9166 40.1199 57.8801 40.1804 57.8692C40.2318 57.8601 40.2831 57.8728 40.3234 57.8984C40.9999 57.7361 41.6672 57.5464 42.3216 57.3331C42.3363 57.2419 42.4096 57.1689 42.505 57.1635C42.5636 57.1598 42.6186 57.1835 42.6571 57.2218C42.8918 57.1416 43.1246 57.0577 43.3556 56.972C43.3226 56.9337 43.3024 56.8845 43.3042 56.8316C43.3079 56.7203 43.4014 56.6328 43.5132 56.6364C43.6232 56.6401 43.7076 56.7295 43.7076 56.8389C48.2833 55.0499 52.2229 52.0082 55.1047 48.1386C55.0259 48.1003 54.9764 48.0183 54.9911 47.9271C55.0094 47.8177 55.1139 47.7429 55.2239 47.7611C55.2697 47.7684 55.3064 47.7921 55.3357 47.8231C55.7445 47.256 56.1295 46.6725 56.4925 46.0743C56.476 46.0233 56.4778 45.9649 56.5053 45.9139L56.5145 45.9212ZM57.6437 43.3791C57.5521 43.4429 57.4256 43.421 57.3614 43.3299C57.2973 43.2387 57.3193 43.1129 57.4109 43.049C57.5026 42.9852 57.6291 43.0071 57.6932 43.0983C57.7574 43.1894 57.7354 43.3153 57.6437 43.3791ZM57.3908 23.3818C57.4787 23.3125 57.6052 23.3271 57.6749 23.4147C57.7446 23.5022 57.7299 23.628 57.6419 23.6973C57.5539 23.7666 57.4274 23.752 57.3578 23.6645C57.2881 23.577 57.3028 23.4511 57.3908 23.3818ZM39.1685 8.62186C39.1025 8.71122 38.976 8.73127 38.8843 8.6638C38.7927 8.59633 38.7743 8.47233 38.8422 8.38115C38.9082 8.29179 39.0347 8.27174 39.1263 8.33921C39.2161 8.40486 39.2363 8.53068 39.1685 8.62186ZM39.3555 7.88879C39.2931 7.98179 39.1666 8.00549 39.075 7.94349C38.9833 7.88149 38.9577 7.75566 39.02 7.66449C39.0823 7.57331 39.2088 7.54778 39.3005 7.60978C39.3921 7.67178 39.4178 7.79761 39.3555 7.88879ZM40.1016 10.4181C40.0429 10.5129 39.9183 10.5421 39.8229 10.4837C39.7276 10.4254 39.6983 10.3014 39.7569 10.2065C39.8156 10.1117 39.9403 10.0825 40.0356 10.1409C40.1309 10.1992 40.1603 10.3233 40.1016 10.4181ZM40.2501 9.38594C40.1951 9.48259 40.0704 9.51723 39.9733 9.46253C39.8761 9.40782 39.8413 9.28382 39.8963 9.18717C39.9513 9.09052 40.0759 9.05587 40.1731 9.11058C40.2702 9.16528 40.3051 9.28929 40.2501 9.38594ZM40.4701 8.60545C40.4187 8.70392 40.2977 8.74404 40.1969 8.6948C40.0979 8.64374 40.0576 8.52339 40.1071 8.42309C40.1584 8.32462 40.2794 8.2845 40.3802 8.33374C40.4792 8.3848 40.5196 8.50515 40.4701 8.60545ZM40.7377 8.02191C40.6919 8.12403 40.5727 8.16962 40.4701 8.12403C40.3674 8.07844 40.3216 7.95991 40.3674 7.85779C40.4132 7.75567 40.5324 7.71008 40.6351 7.75566C40.7377 7.80125 40.7836 7.91979 40.7377 8.02191ZM41.1887 12.5006C41.1429 12.6027 41.0237 12.6483 40.921 12.6027C40.8184 12.5571 40.7726 12.4386 40.8184 12.3365C40.8642 12.2344 40.9834 12.1888 41.086 12.2344C41.1887 12.2799 41.2345 12.3985 41.1887 12.5006ZM41.2474 11.0855C41.2034 11.1876 41.0842 11.2369 40.9815 11.1931C40.8789 11.1493 40.8294 11.0308 40.8734 10.9287C40.9174 10.8266 41.0365 10.7773 41.1392 10.8211C41.2419 10.8649 41.2914 10.9834 41.2474 11.0855ZM41.4179 10.0078C41.3775 10.1117 41.262 10.1646 41.1557 10.1245C41.0512 10.0844 40.998 9.96948 41.0384 9.86371C41.0787 9.75794 41.1942 9.70688 41.3005 9.747C41.405 9.78712 41.4582 9.90201 41.4179 10.0078ZM41.6653 9.17258C41.6305 9.27835 41.5168 9.3367 41.4105 9.30205C41.3042 9.2674 41.2455 9.15434 41.2804 9.04858C41.3152 8.94281 41.4289 8.88445 41.5352 8.9191C41.6415 8.95375 41.7002 9.06681 41.6653 9.17258ZM41.9623 8.53251C41.933 8.6401 41.823 8.70392 41.7148 8.67657C41.6067 8.64739 41.5425 8.53798 41.57 8.43039C41.5993 8.3228 41.7093 8.25897 41.8175 8.28632C41.9257 8.3155 41.9898 8.42492 41.9623 8.53251ZM47.3043 10.8539C47.396 10.7901 47.5225 10.8101 47.5867 10.9013C47.6508 10.9925 47.6307 11.1183 47.539 11.1822C47.4473 11.246 47.3208 11.2259 47.2567 11.1347C47.1925 11.0436 47.2127 10.9177 47.3043 10.8539ZM46.1256 11.37C46.2282 11.3244 46.3474 11.37 46.3932 11.4721C46.4391 11.5742 46.3932 11.6928 46.2906 11.7383C46.1879 11.7839 46.0687 11.7383 46.0229 11.6362C45.9771 11.5341 46.0229 11.4156 46.1256 11.37ZM44.8661 11.6253C44.9761 11.6034 45.0825 11.6727 45.1063 11.7821C45.1283 11.8915 45.0586 11.9973 44.9486 12.021C44.8387 12.0429 44.7323 11.9736 44.7085 11.8642C44.6847 11.7548 44.7562 11.649 44.8661 11.6253ZM44.0375 9.48441C44.1494 9.47529 44.2465 9.55735 44.2557 9.66859C44.2649 9.77983 44.1824 9.87648 44.0705 9.88559C43.9587 9.89471 43.8615 9.81265 43.8524 9.70141C43.8432 9.59018 43.9257 9.49353 44.0375 9.48441ZM43.5811 11.6034C43.6929 11.6034 43.7827 11.6964 43.7809 11.8076C43.779 11.9189 43.6874 12.0082 43.5756 12.0064C43.4637 12.0046 43.3739 11.9134 43.3757 11.8022C43.3757 11.6909 43.4692 11.6016 43.5811 11.6034ZM42.0851 11.4757C42.109 11.3663 42.2171 11.2989 42.3271 11.3226C42.4371 11.3463 42.505 11.4539 42.4811 11.5633C42.4573 11.6727 42.3491 11.7402 42.2391 11.7165C42.1291 11.6928 42.0613 11.5852 42.0851 11.4757ZM42.021 12.9072C42.0466 12.7997 42.1548 12.7322 42.2648 12.7577C42.3748 12.7832 42.4408 12.8908 42.4151 13.0003C42.3895 13.1078 42.2813 13.1753 42.1713 13.1498C42.0631 13.1243 41.9953 13.0167 42.021 12.9072ZM42.318 15.0481C42.208 15.0262 42.1365 14.9205 42.1585 14.8111C42.1805 14.7016 42.2868 14.6305 42.3968 14.6524C42.5068 14.6743 42.5783 14.7801 42.5563 14.8895C42.5343 14.9989 42.428 15.07 42.318 15.0481ZM42.4353 10.6023C42.3253 10.5822 42.252 10.4783 42.2721 10.3688C42.2923 10.2594 42.3968 10.1865 42.5068 10.2065C42.6168 10.2266 42.6901 10.3305 42.6699 10.44C42.6498 10.5494 42.5453 10.6223 42.4353 10.6023ZM42.7103 9.71965C42.5984 9.70506 42.5215 9.60477 42.5343 9.49353C42.549 9.38229 42.6498 9.3057 42.7616 9.31846C42.8734 9.33305 42.9504 9.43335 42.9376 9.54459C42.9229 9.65582 42.8221 9.73241 42.7103 9.71965ZM43.0366 9.01758C42.9248 9.01028 42.8404 8.91363 42.8478 8.80239C42.8551 8.69116 42.9523 8.60727 43.0641 8.61457C43.1759 8.62186 43.2602 8.71851 43.2529 8.82975C43.2456 8.94099 43.1484 9.02487 43.0366 9.01758ZM43.3097 13.2501C43.3116 13.1388 43.4051 13.0513 43.5169 13.0531C43.6287 13.055 43.7167 13.148 43.7149 13.2592C43.7131 13.3704 43.6196 13.458 43.5077 13.4561C43.3959 13.4543 43.3079 13.3613 43.3097 13.2501ZM43.6636 15.3107C43.5517 15.3107 43.4601 15.2232 43.4582 15.1119C43.4582 15.0007 43.5462 14.9095 43.6581 14.9077C43.7699 14.9059 43.8615 14.9952 43.8634 15.1065C43.8634 15.2177 43.7754 15.3089 43.6636 15.3107ZM43.7827 10.8393C43.6709 10.843 43.5774 10.7536 43.5756 10.6424C43.5719 10.5311 43.6617 10.4381 43.7735 10.4363C43.8854 10.4327 43.9789 10.522 43.9807 10.6333C43.9844 10.7445 43.8945 10.8375 43.7827 10.8393ZM44.2465 17.7634C44.1365 17.7798 44.0339 17.7032 44.0174 17.592C44.0009 17.4826 44.0779 17.3805 44.1897 17.3641C44.3015 17.3476 44.4023 17.4242 44.4188 17.5355C44.4353 17.6449 44.3583 17.747 44.2465 17.7634ZM44.6388 13.3267C44.6168 13.2173 44.6902 13.1115 44.8002 13.0896C44.9101 13.0677 45.0165 13.1407 45.0366 13.2501C45.0586 13.3595 44.9853 13.4653 44.8753 13.4853C44.7653 13.5054 44.659 13.4343 44.6388 13.3248V13.3267ZM45.033 15.2888C44.923 15.3144 44.8148 15.2451 44.791 15.1375C44.7653 15.0281 44.835 14.9205 44.9431 14.8968C45.0531 14.8712 45.1613 14.9405 45.1851 15.0481C45.2108 15.1575 45.1411 15.2651 45.033 15.2888ZM45.154 10.7992C45.0458 10.8266 44.9358 10.7609 44.9083 10.6515C44.8808 10.5439 44.9468 10.4345 45.0568 10.4071C45.165 10.3798 45.275 10.4454 45.3025 10.5548C45.33 10.6624 45.264 10.7718 45.154 10.7992ZM45.6013 17.5665C45.4949 17.6048 45.3795 17.5501 45.3428 17.4443C45.3043 17.3385 45.3593 17.2236 45.4656 17.1872C45.5719 17.1507 45.6874 17.2036 45.7241 17.3093C45.7626 17.4151 45.7076 17.53 45.6013 17.5665ZM45.9551 13.117C45.9111 13.0148 45.9588 12.8963 46.0614 12.8525C46.1641 12.8088 46.2832 12.8562 46.3272 12.9583C46.3712 13.0604 46.3236 13.179 46.2209 13.2227C46.1182 13.2665 45.9991 13.2191 45.9551 13.117ZM46.3657 14.9825C46.2649 15.0299 46.1439 14.9843 46.0962 14.884C46.0486 14.7837 46.0944 14.6633 46.1952 14.6159C46.2961 14.5685 46.4171 14.6141 46.4647 14.7144C46.5124 14.8147 46.4666 14.9351 46.3657 14.9825ZM46.4831 10.4655C46.3822 10.5147 46.2612 10.4728 46.2117 10.3725C46.1622 10.2722 46.2044 10.1518 46.3052 10.1026C46.4061 10.0534 46.5271 10.0953 46.5766 10.1956C46.626 10.2959 46.5839 10.4163 46.4831 10.4655ZM46.6077 17.0358C46.5509 16.9392 46.5839 16.817 46.6792 16.7605C46.7764 16.7039 46.8992 16.7367 46.956 16.8316C47.0129 16.9282 46.9799 17.0504 46.8845 17.1069C46.7874 17.1635 46.6645 17.1306 46.6077 17.0358ZM46.9817 20.4477C46.89 20.5115 46.7635 20.4897 46.6994 20.3985C46.6352 20.3073 46.6572 20.1815 46.7489 20.1176C46.8405 20.0538 46.967 20.0757 47.0312 20.1669C47.0954 20.2581 47.0734 20.3839 46.9817 20.4477ZM47.2493 12.3529C47.341 12.2891 47.4675 12.3128 47.5317 12.4039C47.5958 12.4951 47.572 12.6209 47.4803 12.6848C47.3887 12.7486 47.2622 12.7249 47.198 12.6337C47.1339 12.5425 47.1577 12.4167 47.2493 12.3529ZM47.6068 14.4117C47.5152 14.4773 47.3887 14.4555 47.3245 14.3661C47.2585 14.2749 47.2805 14.1491 47.3703 14.0853C47.462 14.0196 47.5885 14.0415 47.6527 14.1309C47.7187 14.222 47.6967 14.3479 47.6068 14.4117ZM47.7975 16.1094C47.8818 16.0365 48.0101 16.0474 48.0835 16.1313C48.1568 16.2152 48.1458 16.3429 48.0615 16.4158C47.9771 16.4887 47.8488 16.4778 47.7755 16.3939C47.7021 16.31 47.7132 16.1824 47.7975 16.1094ZM48.089 19.6672C48.0083 19.7438 47.88 19.7402 47.803 19.6599C47.726 19.5797 47.7296 19.452 47.8103 19.3755C47.891 19.2989 48.0193 19.3025 48.0963 19.3827C48.1733 19.463 48.1696 19.5906 48.089 19.6672ZM48.3126 11.6271C48.3914 11.5487 48.5198 11.5487 48.5986 11.6271C48.6774 11.7055 48.6774 11.8332 48.5986 11.9116C48.5198 11.99 48.3914 11.99 48.3126 11.9116C48.2338 11.8332 48.2338 11.7055 48.3126 11.6271ZM48.4244 13.6184C48.3438 13.54 48.3419 13.4124 48.4208 13.334C48.4996 13.2556 48.6279 13.2519 48.7068 13.3303C48.7856 13.4087 48.7893 13.5364 48.7104 13.6148C48.6316 13.6932 48.5033 13.6969 48.4244 13.6184ZM49.0716 18.7408C49.0001 18.8266 48.8736 18.8411 48.7856 18.77C48.6994 18.6989 48.6848 18.5731 48.7563 18.4855C48.8278 18.3998 48.9542 18.3853 49.0422 18.4564C49.1302 18.5275 49.1431 18.6533 49.0716 18.7408ZM49.0936 15.5387C49.0202 15.6225 48.8919 15.6335 48.8076 15.5605C48.7233 15.4876 48.7123 15.36 48.7856 15.2761C48.8589 15.1922 48.9872 15.1812 49.0716 15.2542C49.1559 15.3271 49.1669 15.4548 49.0936 15.5387ZM49.3759 12.6939C49.2842 12.6282 49.2641 12.5024 49.3282 12.4131C49.3942 12.3219 49.5207 12.3018 49.6105 12.3656C49.7022 12.4313 49.7224 12.5571 49.6582 12.6465C49.5922 12.7377 49.4657 12.7577 49.3759 12.6939ZM49.924 17.6959C49.8635 17.7908 49.7389 17.8181 49.6435 17.7579C49.5482 17.6978 49.5207 17.5738 49.5812 17.4789C49.6417 17.3841 49.7664 17.3568 49.8617 17.4169C49.957 17.4771 49.9845 17.6011 49.924 17.6959ZM49.9735 14.5138C49.913 14.6068 49.7865 14.6342 49.693 14.574C49.5995 14.5138 49.572 14.388 49.6325 14.295C49.693 14.202 49.8195 14.1746 49.913 14.2348C50.0065 14.295 50.034 14.4208 49.9735 14.5138ZM51.3466 14.0032C51.3796 13.8974 51.4914 13.8373 51.5996 13.8683C51.7059 13.9011 51.7664 14.0123 51.7352 14.1199C51.7023 14.2257 51.5904 14.2859 51.4823 14.2549C51.3759 14.222 51.3154 14.1108 51.3466 14.0032ZM50.342 13.2063C50.3915 13.106 50.5125 13.0659 50.6133 13.1133C50.7141 13.1625 50.7545 13.2829 50.7068 13.3832C50.6573 13.4835 50.5363 13.5236 50.4355 13.4762C50.3347 13.4288 50.2943 13.3066 50.342 13.2063ZM50.3732 16.6529C50.2723 16.6036 50.232 16.4814 50.2815 16.383C50.331 16.2845 50.4538 16.2426 50.5528 16.2918C50.6518 16.341 50.694 16.4632 50.6445 16.5617C50.595 16.6602 50.4722 16.7021 50.3732 16.6529ZM51.0295 21.2665C50.991 21.3704 50.8755 21.4251 50.7691 21.3868C50.6646 21.3486 50.6096 21.2337 50.6481 21.1279C50.6866 21.024 50.8021 20.9693 50.9085 21.0075C51.013 21.0458 51.068 21.1607 51.0295 21.2665ZM50.9836 15.4785C50.8791 15.4384 50.8278 15.3217 50.8681 15.2177C50.9085 15.1138 51.0258 15.0627 51.1303 15.1028C51.2348 15.1429 51.2861 15.2597 51.2458 15.3636C51.2054 15.4675 51.0881 15.5186 50.9836 15.4785ZM51.4841 20.0155C51.4511 20.1213 51.3374 20.1815 51.2311 20.1486C51.1248 20.1158 51.0643 20.0028 51.0973 19.897C51.1303 19.7912 51.2439 19.731 51.3503 19.7639C51.4566 19.7967 51.5171 19.9098 51.4841 20.0155ZM51.8801 18.7445C51.8507 18.8521 51.7407 18.9159 51.6326 18.8886C51.5244 18.8594 51.4603 18.75 51.4878 18.6424C51.5171 18.5348 51.6271 18.471 51.7352 18.4983C51.8434 18.5275 51.9076 18.6369 51.8801 18.7445ZM52.2211 17.4589C52.1972 17.5683 52.0891 17.6376 51.9809 17.6139C51.8709 17.5902 51.8012 17.4826 51.8251 17.375C51.8489 17.2674 51.9571 17.1963 52.0652 17.22C52.1752 17.2437 52.2449 17.3513 52.2211 17.4589ZM52.2687 16.3246C52.1587 16.3046 52.0854 16.2006 52.1037 16.0912C52.1221 15.9818 52.2284 15.9088 52.3384 15.9271C52.4484 15.9471 52.5217 16.0511 52.5034 16.1605C52.4832 16.2699 52.3787 16.3429 52.2687 16.3246ZM52.507 15.0244C52.397 15.0098 52.3182 14.9077 52.3347 14.7965C52.3512 14.6852 52.452 14.6086 52.5639 14.6251C52.6739 14.6396 52.7527 14.7418 52.7362 14.853C52.7215 14.9624 52.6189 15.0408 52.507 15.0244ZM23.762 51.1384C23.6924 51.1238 23.6337 51.0764 23.6099 51.0034C23.5769 50.8977 23.6374 50.7846 23.7437 50.7518C23.8244 50.7263 23.9087 50.7554 23.96 50.8156C23.9729 50.8193 23.9857 50.8193 23.9967 50.8247C23.9875 50.7317 24.0407 50.6406 24.1342 50.6114C24.2167 50.5858 24.3029 50.6168 24.3523 50.6788C24.3688 50.6168 24.4128 50.5621 24.4788 50.5403C24.5852 50.5038 24.6988 50.5603 24.7355 50.6661C24.7447 50.6588 24.7538 50.6497 24.7648 50.646C24.807 50.626 24.8528 50.626 24.895 50.6369C24.8858 50.6223 24.8766 50.6096 24.8712 50.5931C24.8363 50.4874 24.8931 50.3725 24.9995 50.3378C25.0563 50.3196 25.1168 50.3287 25.1645 50.3579C25.247 50.3579 25.324 50.4071 25.3533 50.4892C25.3698 50.5366 25.3661 50.5858 25.3496 50.6296C25.4248 50.6096 25.5036 50.6351 25.5531 50.6953C25.6173 50.6971 25.6796 50.7263 25.7163 50.7846C25.7346 50.8138 25.7419 50.8484 25.7438 50.8813C25.7529 50.8904 25.7639 50.8959 25.7713 50.905C25.8263 50.9779 25.8208 51.0746 25.7676 51.1439C25.8061 51.2241 25.7933 51.3207 25.7236 51.3809C25.7034 51.3992 25.6796 51.4119 25.6558 51.4192C25.7071 51.494 25.7053 51.5943 25.6411 51.6636C25.5659 51.7456 25.4376 51.7529 25.3551 51.68C25.2726 51.607 25.2653 51.4776 25.3386 51.3955C25.3625 51.37 25.3918 51.3536 25.423 51.3426C25.3735 51.2715 25.3771 51.1785 25.4285 51.111C25.4175 51.0873 25.4101 51.0618 25.4083 51.0363C25.401 51.0308 25.3955 51.0235 25.39 51.0162C25.346 51.0144 25.3038 50.9998 25.269 50.9724C25.2653 50.9743 25.2616 50.9797 25.258 50.9816C25.1736 51.0235 25.0746 50.998 25.016 50.9287C24.9958 50.9633 24.9683 50.9925 24.928 51.0107C24.8253 51.0563 24.7062 51.0107 24.6603 50.9086C24.6585 50.9031 24.6585 50.8959 24.6567 50.8904C24.6493 50.8959 24.6402 50.8995 24.6328 50.905C24.6292 50.9816 24.5833 51.0527 24.5082 51.0837C24.411 51.122 24.3047 51.08 24.257 50.9907C24.257 50.9907 24.2552 50.9907 24.2534 50.9925C24.2039 51.0071 24.1544 51.0016 24.1122 50.9816C24.1214 51.0691 24.0755 51.1548 23.9912 51.1894C24.0554 51.1931 24.1177 51.2241 24.1544 51.2825C24.2424 51.2387 24.3505 51.2624 24.4092 51.3445C24.4202 51.3609 24.4257 51.3791 24.4312 51.3955C24.488 51.3955 24.543 51.4192 24.5815 51.4648C24.62 51.5104 24.6328 51.5687 24.6255 51.6235C24.6457 51.6326 24.664 51.6417 24.6805 51.6581C24.7575 51.731 24.7612 51.8496 24.697 51.9298C24.7025 51.9335 24.7098 51.9335 24.7153 51.9371C24.8052 52.0028 24.8272 52.1286 24.7612 52.2179C24.6952 52.3073 24.5687 52.3292 24.4788 52.2635C24.389 52.1979 24.367 52.0721 24.433 51.9827C24.4348 51.9791 24.4403 51.9772 24.4422 51.9736C24.4293 51.9663 24.4147 51.9608 24.4037 51.9499C24.3542 51.9025 24.3377 51.8386 24.3468 51.7766C24.3193 51.7639 24.2955 51.7475 24.2754 51.7238C24.2589 51.7037 24.246 51.68 24.2387 51.6563C24.1782 51.6545 24.1177 51.6271 24.081 51.5742C24.0792 51.5706 24.0792 51.5669 24.0774 51.5633C23.9839 51.6107 23.8665 51.5797 23.8134 51.4885C23.8115 51.4849 23.8115 51.4794 23.8079 51.4739C23.7895 51.5013 23.7657 51.5268 23.7327 51.5432C23.6319 51.5943 23.5109 51.5542 23.4596 51.4539C23.4082 51.3536 23.4486 51.2332 23.5494 51.1822C23.6484 51.1329 23.7694 51.1712 23.8207 51.2697C23.8372 51.246 23.8574 51.2259 23.883 51.2095C23.8904 51.204 23.8995 51.204 23.9087 51.2004C23.8537 51.1967 23.8042 51.1712 23.7675 51.1293L23.762 51.1384ZM25.071 53.3486C25.0563 53.4598 24.9536 53.5364 24.8437 53.5218C24.7318 53.5072 24.6548 53.4051 24.6695 53.2957C24.6732 53.2738 24.6805 53.2556 24.6897 53.2373C24.6457 53.261 24.5943 53.2683 24.543 53.2556C24.4348 53.2264 24.3707 53.117 24.3982 53.0094C24.4275 52.9018 24.5375 52.838 24.6457 52.8653C24.6677 52.8708 24.686 52.8817 24.7043 52.8945C24.752 52.8307 24.8345 52.7978 24.9151 52.8179C24.9445 52.8252 24.9701 52.8398 24.9921 52.858C25.005 52.858 25.016 52.8562 25.0288 52.858C25.1388 52.8817 25.2085 52.9893 25.1846 53.0969C25.17 53.168 25.115 53.2209 25.0508 53.2428C25.0655 53.2756 25.0746 53.3121 25.0691 53.3504L25.071 53.3486ZM24.8895 54.5795C24.917 54.6871 24.8528 54.7965 24.7428 54.8256C24.6347 54.853 24.5247 54.7892 24.4953 54.6798C24.477 54.6105 24.5008 54.543 24.5467 54.4938C24.499 54.4938 24.455 54.4773 24.4202 54.4482C24.3963 54.4846 24.3597 54.512 24.3157 54.5266C24.3193 54.5375 24.3267 54.5485 24.3285 54.5594C24.3487 54.6688 24.2754 54.7746 24.1654 54.7946C24.0554 54.8147 23.949 54.7418 23.9289 54.6323C23.9105 54.5321 23.971 54.439 24.0664 54.408C24.0609 54.3935 24.0535 54.3789 24.0517 54.3625C24.0389 54.2512 24.1177 54.1509 24.2295 54.1382C24.2882 54.1309 24.3432 54.1509 24.3835 54.1856C24.4147 54.14 24.4623 54.1053 24.5228 54.098C24.5833 54.0889 24.6402 54.1108 24.6842 54.1491C24.7905 54.1363 24.8876 54.2075 24.9078 54.3132C24.9206 54.3843 24.8913 54.4518 24.84 54.4956C24.862 54.5193 24.8803 54.5466 24.8895 54.5813V54.5795ZM24.6493 55.2688C24.5448 55.3089 24.4275 55.256 24.3872 55.1521C24.3468 55.0481 24.4 54.9314 24.5045 54.8913C24.609 54.8512 24.7263 54.9041 24.7667 55.008C24.807 55.1119 24.7538 55.2287 24.6493 55.2688ZM24.0389 53.4981C24.1507 53.5109 24.2295 53.6093 24.2185 53.7206C24.2057 53.8318 24.1067 53.9102 23.9949 53.8993C23.883 53.8865 23.8042 53.788 23.8152 53.6768C23.828 53.5656 23.927 53.4871 24.0389 53.4981ZM23.7547 53.3686C23.6484 53.334 23.5916 53.2191 23.6264 53.1133C23.6612 53.0075 23.7767 52.951 23.883 52.9857C23.9894 53.0203 24.0462 53.1352 24.0114 53.241C23.9765 53.3467 23.861 53.4033 23.7547 53.3686ZM24.4018 53.757C24.4037 53.6458 24.4972 53.5564 24.609 53.5601C24.7208 53.5619 24.8107 53.6549 24.807 53.7662C24.8052 53.8774 24.7117 53.9667 24.5998 53.9631C24.488 53.9613 24.3982 53.8683 24.4018 53.757ZM24.4238 52.4258C24.4733 52.3255 24.5943 52.2854 24.6952 52.3346C24.796 52.3839 24.8363 52.5042 24.7868 52.6045C24.7373 52.7048 24.6163 52.745 24.5155 52.6957C24.4147 52.6465 24.3743 52.5261 24.4238 52.4258ZM22.4825 51.1402C22.5851 51.1129 22.6896 51.1694 22.7244 51.2697C22.7299 51.2697 22.7373 51.2715 22.7428 51.2733C22.7391 51.2642 22.7336 51.2587 22.7299 51.2496C22.7006 51.142 22.7629 51.0308 22.8711 51.0016C22.9151 50.9889 22.9591 50.9961 22.9994 51.0126C23.0251 50.9761 23.0618 50.9451 23.1094 50.9323C23.1681 50.9159 23.2267 50.9287 23.2726 50.9579C23.3624 50.9524 23.4486 51.0034 23.4779 51.0946C23.5072 51.1858 23.4669 51.277 23.3881 51.3244C23.4266 51.4247 23.3789 51.5378 23.2799 51.5797C23.1772 51.6235 23.0581 51.576 23.0141 51.4739C23.0013 51.4429 22.9976 51.4101 23.0013 51.3791C22.9939 51.3827 22.9866 51.3882 22.9793 51.39C22.9353 51.4028 22.8913 51.3955 22.8509 51.3791C22.8509 51.3827 22.8564 51.3864 22.8583 51.39C22.8968 51.494 22.8418 51.6107 22.7354 51.6472C22.6309 51.6855 22.5136 51.6307 22.477 51.525C22.477 51.525 22.477 51.5232 22.477 51.5213C22.4128 51.5013 22.3596 51.4539 22.3413 51.3864C22.312 51.2788 22.3761 51.1676 22.4843 51.1384L22.4825 51.1402ZM22.3468 51.793C22.4421 51.7365 22.5668 51.7675 22.6254 51.8623C22.6511 51.9061 22.6566 51.9553 22.6493 52.0028C22.6621 51.9645 22.6823 51.928 22.7171 51.9025C22.8069 51.835 22.9334 51.8532 23.0013 51.9426C23.0288 51.9791 23.0379 52.021 23.0379 52.0611C23.1186 52.0046 23.2286 52.0082 23.3001 52.0812C23.3496 52.1322 23.3624 52.1997 23.3496 52.2635C23.4119 52.2416 23.4834 52.2489 23.5384 52.2927C23.6246 52.3602 23.6411 52.4842 23.5751 52.5717C23.6246 52.5589 23.6777 52.5626 23.7254 52.59C23.8225 52.6428 23.8592 52.7668 23.8042 52.8635C23.7511 52.9601 23.6264 52.9966 23.5292 52.9419C23.4321 52.889 23.3954 52.765 23.4504 52.6684C23.4559 52.6574 23.4669 52.6501 23.4742 52.641C23.4119 52.6611 23.3441 52.6538 23.2891 52.6118C23.2267 52.5626 23.2029 52.486 23.2176 52.4131C23.1461 52.4368 23.0654 52.4204 23.0104 52.3638C22.9738 52.3255 22.9573 52.2781 22.9554 52.2289C22.8674 52.2891 22.7446 52.2727 22.6786 52.1851C22.6456 52.1414 22.6328 52.0885 22.6401 52.0374C22.6236 52.0775 22.598 52.1158 22.5576 52.1395C22.4623 52.1961 22.3376 52.1651 22.279 52.0702C22.2221 51.9754 22.2533 51.8514 22.3486 51.793H22.3468ZM21.6025 51.3499C21.6483 51.3408 21.6905 51.3499 21.729 51.3682C21.7565 51.3317 21.795 51.3025 21.8427 51.2916C21.8812 51.2824 21.9197 51.2897 21.9545 51.3007C22.0168 51.3025 22.0736 51.3299 22.1103 51.3791C22.1598 51.4028 22.1983 51.4466 22.2148 51.5031C22.2441 51.607 22.1855 51.7146 22.0846 51.7493C22.1176 51.7693 22.147 51.7949 22.1653 51.8332C22.213 51.9335 22.169 52.0538 22.0663 52.1012C21.9637 52.1486 21.8445 52.1049 21.7968 52.0028C21.7492 51.9006 21.7932 51.7821 21.8958 51.7347C21.9032 51.731 21.9087 51.7329 21.916 51.7292C21.8958 51.7183 21.8793 51.7037 21.8647 51.6855C21.8427 51.6836 21.8243 51.6763 21.8042 51.6672C21.7767 51.7037 21.7363 51.7329 21.6868 51.7438C21.5768 51.7675 21.4705 51.6982 21.4467 51.5888C21.4229 51.4794 21.4925 51.3736 21.6025 51.3499ZM17.5034 52.1049C17.4759 52.2125 17.3641 52.2763 17.2559 52.2489C17.1478 52.2216 17.0836 52.1104 17.1111 52.0028C17.1386 51.8952 17.2504 51.8313 17.3586 51.8587C17.4668 51.8861 17.5309 51.9973 17.5034 52.1049ZM18.1432 52.6173C18.0406 52.6173 17.9581 52.5425 17.9434 52.4441C17.9122 52.4587 17.8792 52.4678 17.8426 52.4641C17.7307 52.455 17.6482 52.3565 17.6592 52.2453C17.6629 52.207 17.6794 52.1742 17.7014 52.145C17.6849 52.145 17.6702 52.1468 17.6537 52.1432C17.5456 52.1176 17.4777 52.0082 17.5052 51.8988C17.5309 51.7912 17.6409 51.7238 17.7509 51.7511C17.7894 51.7602 17.8206 51.7821 17.8462 51.8095C17.8884 51.7821 17.9397 51.7712 17.9929 51.7803C18.0754 51.7967 18.1377 51.8605 18.1524 51.9371C18.2037 51.9809 18.2349 52.0447 18.2239 52.1158C18.2184 52.1559 18.1982 52.1906 18.1725 52.2179C18.2679 52.2344 18.3412 52.3109 18.343 52.4094C18.3449 52.5207 18.255 52.6118 18.1432 52.6137V52.6173ZM18.5117 52.4021C18.508 52.3565 18.5209 52.3164 18.5429 52.2799C18.475 52.2453 18.4292 52.1742 18.4329 52.0939C18.4365 51.9827 18.5319 51.8952 18.6437 51.9006C18.7555 51.9043 18.8435 51.9991 18.838 52.1104C18.838 52.1468 18.8233 52.1796 18.805 52.207C18.8637 52.238 18.9095 52.2927 18.915 52.3638C18.926 52.4751 18.8435 52.5735 18.7317 52.5845C18.6199 52.5954 18.5209 52.5134 18.5099 52.4021H18.5117ZM18.959 52.9455C18.8508 52.9765 18.739 52.9164 18.7078 52.8088C18.6767 52.7012 18.7372 52.59 18.8453 52.5589C18.9535 52.5279 19.0653 52.5881 19.0965 52.6957C19.1277 52.8033 19.0672 52.9145 18.959 52.9455ZM19.201 52.3657C19.0892 52.3748 18.992 52.2909 18.9828 52.1796C18.9828 52.1796 18.9828 52.176 18.9828 52.1742C18.8912 52.1523 18.8233 52.0739 18.8252 51.9772C18.8288 51.866 18.9205 51.7785 19.0323 51.7803C19.0745 51.7803 19.1112 51.7985 19.1423 51.8204C19.1772 51.7876 19.223 51.7675 19.2761 51.7675C19.3458 51.7675 19.4026 51.8022 19.4393 51.855C19.5016 51.8879 19.5456 51.9481 19.5493 52.021C19.5493 52.0301 19.5456 52.0392 19.5456 52.0484C19.6006 52.0775 19.6428 52.1286 19.652 52.1942C19.6685 52.3036 19.5915 52.4076 19.4815 52.424C19.4026 52.4349 19.3275 52.3985 19.2853 52.3365C19.2596 52.3511 19.2303 52.3638 19.1992 52.3657H19.201ZM19.707 53.2574C19.6116 53.3157 19.487 53.2866 19.4283 53.1917C19.3696 53.0969 19.399 52.9729 19.4943 52.9145C19.5896 52.8562 19.7143 52.8854 19.7729 52.9802C19.8316 53.075 19.8023 53.199 19.707 53.2574ZM19.7528 51.9772C19.74 51.866 19.8206 51.7675 19.9324 51.7548C20.0443 51.742 20.1433 51.8222 20.1561 51.9335C20.1689 52.0447 20.0883 52.1432 19.9764 52.1559C19.8646 52.1687 19.7656 52.0885 19.7528 51.9772ZM19.9691 52.4039C19.9343 52.2982 19.9929 52.1851 20.0993 52.1486C20.2056 52.114 20.3193 52.1724 20.3559 52.2781C20.3907 52.3839 20.3321 52.4969 20.2258 52.5334C20.1194 52.5681 20.0058 52.5097 19.9691 52.4039ZM20.3999 53.5765C20.3229 53.6567 20.1946 53.6622 20.1139 53.5856C20.0333 53.509 20.0278 53.3814 20.1048 53.3011C20.1818 53.2209 20.3101 53.2154 20.3907 53.292C20.4714 53.3686 20.4769 53.4963 20.3999 53.5765ZM20.3156 52.021C20.2276 52.0082 20.1561 51.9408 20.1451 51.8496C20.1323 51.7383 20.2111 51.638 20.3229 51.6253C20.3669 51.6198 20.4072 51.6326 20.4421 51.6526C20.4732 51.618 20.5154 51.5906 20.5649 51.5833C20.6162 51.576 20.6639 51.5906 20.7042 51.6162C20.7721 51.6326 20.8234 51.6818 20.8472 51.7493C20.8949 51.7766 20.9315 51.8204 20.9444 51.8769C20.97 51.9845 20.9022 52.0939 20.7922 52.1195C20.7262 52.1341 20.6639 52.114 20.6162 52.0739C20.5906 52.0958 20.5612 52.1122 20.5264 52.1195C20.4402 52.1359 20.3577 52.0939 20.3156 52.0228V52.021ZM20.5979 52.5662C20.5466 52.4678 20.5851 52.3456 20.6841 52.2945C20.7831 52.2435 20.9059 52.2818 20.9572 52.3802C21.0085 52.4787 20.97 52.6009 20.8711 52.652C20.7721 52.703 20.6492 52.6647 20.5979 52.5662ZM21.0507 53.9212C20.9975 54.0196 20.8747 54.0543 20.7757 54.0014C20.6767 53.9485 20.6419 53.8263 20.6951 53.7279C20.7482 53.6294 20.8711 53.5947 20.97 53.6476C21.069 53.7005 21.1039 53.8227 21.0507 53.9212ZM21.0562 51.7256C21.0324 51.6162 21.1039 51.5104 21.212 51.4867C21.322 51.463 21.4284 51.5341 21.4522 51.6417C21.4577 51.6654 21.4559 51.6873 21.4522 51.7092C21.5218 51.7219 21.5823 51.7675 21.608 51.8386C21.6447 51.9444 21.5897 52.0593 21.4833 52.0958C21.377 52.1322 21.2615 52.0775 21.2249 51.9718C21.2139 51.9426 21.2139 51.9116 21.2175 51.8824C21.1387 51.8678 21.0727 51.8076 21.0562 51.7256ZM21.1882 52.4805C21.278 52.4131 21.4045 52.4313 21.4723 52.5207C21.5402 52.61 21.5218 52.7358 21.432 52.8033C21.3422 52.8708 21.2157 52.8525 21.1479 52.7632C21.08 52.6738 21.0984 52.548 21.1882 52.4805ZM21.6795 54.3023C21.652 54.4099 21.5402 54.4755 21.432 54.4463C21.3239 54.419 21.2579 54.3078 21.2872 54.2002C21.3147 54.0926 21.4265 54.0269 21.5347 54.0561C21.6428 54.0835 21.7088 54.1947 21.6795 54.3023ZM21.641 53.0057C21.5585 52.9291 21.5548 52.8015 21.6318 52.7212C21.7088 52.6392 21.8372 52.6355 21.9178 52.7121C22.0003 52.7887 22.004 52.9164 21.927 52.9966C21.85 53.0787 21.7217 53.0823 21.641 53.0057ZM22.1066 54.9223C21.9948 54.9223 21.905 54.8293 21.9068 54.7181C21.9068 54.6068 22.0003 54.5175 22.1121 54.5193C22.224 54.5211 22.3138 54.6123 22.312 54.7235C22.312 54.8348 22.2185 54.9241 22.1066 54.9223ZM22.0901 53.3103C21.9967 53.2501 21.9692 53.1261 22.0278 53.0313C22.0883 52.9383 22.213 52.9109 22.3083 52.9693C22.4018 53.0294 22.4293 53.1534 22.3706 53.2483C22.3101 53.3413 22.1855 53.3686 22.0901 53.3103ZM22.4055 53.4197C22.4458 53.3157 22.5631 53.2647 22.6676 53.3048C22.7721 53.3449 22.8234 53.4616 22.7831 53.5656C22.7428 53.6695 22.6254 53.7206 22.521 53.6804C22.4165 53.6403 22.3651 53.5236 22.4055 53.4197ZM22.8088 55.422C22.6988 55.4457 22.5906 55.3764 22.5668 55.2688C22.543 55.1594 22.6126 55.0518 22.7208 55.0281C22.8308 55.0044 22.9389 55.0737 22.9628 55.1812C22.9866 55.2888 22.9169 55.3983 22.8088 55.422ZM22.9518 54.1217C22.8418 54.1035 22.7666 53.9996 22.7849 53.8902C22.8033 53.7807 22.9078 53.706 23.0178 53.7242C23.1278 53.7424 23.2029 53.8464 23.1846 53.9558C23.1663 54.0652 23.0618 54.14 22.9518 54.1217ZM23.3899 54.2293C23.5017 54.2239 23.5971 54.3096 23.6026 54.4208C23.6081 54.5321 23.5219 54.6269 23.4101 54.6323C23.2982 54.6378 23.2029 54.5521 23.1974 54.4409C23.1919 54.3296 23.2781 54.2348 23.3899 54.2293ZM23.5512 55.9326C23.4504 55.98 23.3294 55.9344 23.2817 55.8341C23.2341 55.7338 23.2799 55.6134 23.3807 55.566C23.4816 55.5186 23.6026 55.5642 23.6502 55.6645C23.6979 55.7648 23.6521 55.8851 23.5512 55.9326ZM23.9234 55.2068C23.8152 55.2359 23.7034 55.1739 23.6741 55.0664C23.6447 54.9588 23.7071 54.8475 23.8152 54.8183C23.9234 54.7892 24.0352 54.8512 24.0645 54.9588C24.0939 55.0664 24.0315 55.1776 23.9234 55.2068ZM24.3487 56.445C24.2589 56.5106 24.1324 56.4924 24.0645 56.403C23.9985 56.3137 24.0169 56.1879 24.1067 56.1204C24.1965 56.0547 24.323 56.073 24.3908 56.1623C24.4568 56.2517 24.4385 56.3775 24.3487 56.445ZM24.8437 55.8231C24.8272 55.8158 24.8125 55.8049 24.7997 55.7921C24.7245 55.8177 24.642 55.7958 24.5888 55.7374C24.5778 55.7593 24.5632 55.7775 24.5448 55.794C24.598 55.887 24.5687 56.0055 24.477 56.0639C24.3817 56.1222 24.257 56.093 24.1984 55.9982C24.147 55.9143 24.1654 55.8104 24.2369 55.7466C24.2369 55.7466 24.2369 55.7465 24.235 55.7447C24.1819 55.6463 24.2185 55.5241 24.3157 55.4712C24.4 55.4256 24.499 55.4493 24.5595 55.5168C24.576 55.4821 24.6017 55.4511 24.6365 55.4311C24.7153 55.3873 24.8088 55.4019 24.8712 55.4603C24.9591 55.4311 25.0563 55.4602 25.1058 55.5441C25.1425 55.6043 25.1406 55.6736 25.1131 55.7338C25.1425 55.7484 25.1681 55.7666 25.1883 55.794C25.2525 55.8851 25.2323 56.011 25.1406 56.0748C25.049 56.1386 24.9225 56.1186 24.8583 56.0274C24.8143 55.9654 24.8125 55.8888 24.8437 55.825V55.8231ZM25.1846 56.4669C25.1003 56.5398 24.972 56.5307 24.8987 56.4468C24.8253 56.3629 24.8345 56.2353 24.9188 56.1623C25.0031 56.0894 25.1315 56.0985 25.2048 56.1824C25.2781 56.2663 25.269 56.3939 25.1846 56.4669ZM25.2891 52.61C25.247 52.714 25.1296 52.7632 25.0251 52.7212C24.9206 52.6793 24.8712 52.5626 24.9133 52.4587C24.9555 52.3547 25.0728 52.3055 25.1773 52.3474C25.2818 52.3894 25.3313 52.5061 25.2891 52.61ZM25.8464 52.0265C25.8098 52.0866 25.7456 52.1176 25.6796 52.1195C25.6851 52.1596 25.6833 52.2015 25.6631 52.2416C25.6118 52.3401 25.4889 52.3784 25.39 52.3274C25.3221 52.2927 25.2836 52.2216 25.2836 52.1505C25.2598 52.145 25.236 52.1377 25.214 52.1231C25.1205 52.0629 25.0948 51.9371 25.1553 51.8441C25.2158 51.7511 25.3423 51.7256 25.4358 51.7858C25.4596 51.8003 25.4779 51.8204 25.4926 51.8423C25.4963 51.835 25.4963 51.8259 25.5018 51.8186C25.5604 51.7238 25.6833 51.6928 25.7804 51.7493C25.8758 51.8076 25.9069 51.9298 25.8501 52.0265H25.8464ZM26.0902 51.6308C26.0206 51.7183 25.8923 51.731 25.8061 51.6618C25.7181 51.5925 25.7053 51.4648 25.7749 51.3791C25.8446 51.2916 25.9729 51.2788 26.0591 51.3481C26.1471 51.4174 26.1599 51.545 26.0902 51.6308ZM26.5321 51.3171C26.4569 51.3992 26.3286 51.4046 26.2461 51.328C26.2149 51.2989 26.1984 51.2606 26.1892 51.2223C26.1727 51.2132 26.1562 51.204 26.1434 51.1894C26.0664 51.1074 26.0701 50.9816 26.1526 50.905C26.2351 50.8284 26.3616 50.832 26.4386 50.9141C26.4642 50.9414 26.4789 50.9761 26.4862 51.0107C26.4991 51.018 26.5119 51.0217 26.5211 51.0326C26.6035 51.1074 26.609 51.235 26.5321 51.3171ZM27.0857 50.8211C26.9995 50.8922 26.8712 50.8794 26.7997 50.7937C26.7759 50.7646 26.7649 50.7317 26.7594 50.6989C26.7539 50.6989 26.7484 50.7044 26.7447 50.7044C26.7539 50.7737 26.73 50.8448 26.6695 50.8904C26.5797 50.9579 26.4532 50.9414 26.3854 50.8521C26.3176 50.7627 26.3341 50.6369 26.4239 50.5694C26.4477 50.5512 26.4752 50.5403 26.5027 50.5348C26.4991 50.5001 26.5046 50.4655 26.5174 50.4345C26.5119 50.4327 26.5082 50.429 26.5027 50.4254C26.4899 50.4345 26.4789 50.4454 26.4642 50.4527C26.3891 50.4856 26.3066 50.4691 26.2497 50.4181C26.2277 50.4582 26.1966 50.491 26.1507 50.5093C26.0682 50.5439 25.9766 50.5166 25.9216 50.4527C25.9051 50.4655 25.8868 50.4783 25.8648 50.4874C25.8629 50.4874 25.8611 50.4874 25.8593 50.4874C25.8391 50.5403 25.8006 50.584 25.7438 50.6059C25.6393 50.646 25.5219 50.595 25.4816 50.491C25.4413 50.3871 25.4926 50.2704 25.5971 50.2303C25.6008 50.2303 25.6063 50.2303 25.6099 50.2284C25.6301 50.1737 25.6704 50.1263 25.7309 50.1062C25.8116 50.0789 25.8978 50.1062 25.9509 50.1664C25.9656 50.1555 25.9784 50.1445 25.9949 50.1372C26.0682 50.1062 26.1489 50.1245 26.2057 50.1737C26.2094 50.1683 26.2131 50.1628 26.2167 50.1573C26.1911 50.057 26.2424 49.9531 26.3414 49.9184C26.4459 49.8801 26.5632 49.9348 26.6017 50.0388C26.6017 50.0442 26.6017 50.0479 26.6035 50.0534C26.6384 50.0534 26.6714 50.0661 26.7025 50.0825C26.7227 50.0807 26.7429 50.0825 26.763 50.0862C26.7465 50.068 26.7337 50.0479 26.7245 50.0242C26.686 49.9202 26.7392 49.8035 26.8437 49.7652C26.9482 49.7269 27.0655 49.7798 27.104 49.8838C27.1425 49.9877 27.0894 50.1044 26.9849 50.1427C26.9464 50.1573 26.9079 50.1555 26.8712 50.1482C26.8822 50.161 26.895 50.1719 26.9042 50.1883C26.9134 50.2084 26.9189 50.2284 26.9207 50.2485C26.9244 50.254 26.9299 50.2576 26.9335 50.2631C26.972 50.3287 26.9647 50.4071 26.928 50.4673C26.9959 50.4582 27.0655 50.4801 27.1114 50.5348C27.1828 50.6205 27.17 50.7481 27.0839 50.8193L27.0857 50.8211ZM28.072 49.9531C28.0573 50.0023 28.0225 50.0479 27.973 50.0734C27.9455 50.088 27.918 50.0935 27.8905 50.0953C27.8813 50.1518 27.8501 50.2047 27.7951 50.2357C27.72 50.2795 27.6283 50.2685 27.5642 50.2157C27.6118 50.305 27.588 50.4181 27.5018 50.4764C27.4083 50.5384 27.2837 50.5147 27.2195 50.4217C27.1553 50.3287 27.181 50.2047 27.2745 50.1409C27.3497 50.0898 27.4468 50.099 27.5147 50.1537C27.478 50.0862 27.4853 50.0078 27.5257 49.9476C27.5147 49.9421 27.5055 49.9348 27.4963 49.9275C27.4743 49.9731 27.4377 50.0114 27.3863 50.0315C27.2818 50.0716 27.1645 50.0205 27.1242 49.9166C27.0839 49.8127 27.1352 49.6959 27.2397 49.6558C27.3075 49.6303 27.379 49.6449 27.4322 49.685C27.4523 49.6394 27.489 49.6029 27.5385 49.5829C27.5898 49.5628 27.6448 49.5646 27.6925 49.5829C27.7072 49.5701 27.7237 49.5574 27.742 49.5482C27.7915 49.5264 27.8446 49.5282 27.8923 49.5464C27.984 49.5264 28.0811 49.5683 28.1215 49.6558C28.127 49.6668 28.127 49.6777 28.1288 49.6887C28.1325 49.6941 28.1361 49.6959 28.1398 49.7014C28.1838 49.7908 28.1508 49.8929 28.0738 49.9494L28.072 49.9531ZM38.1767 53.912C38.2409 53.8209 38.3674 53.7971 38.459 53.861C38.5507 53.9248 38.5745 54.0506 38.5104 54.1418C38.4462 54.233 38.3197 54.2567 38.228 54.1929C38.1364 54.129 38.1125 54.0032 38.1767 53.912ZM34.5964 58.2011C34.4846 58.2065 34.3893 58.1208 34.3856 58.0096C34.3801 57.8984 34.4663 57.8035 34.5781 57.7999C34.6899 57.7944 34.7852 57.8801 34.7889 57.9914C34.7926 58.1026 34.7082 58.1974 34.5964 58.2011ZM35.524 55.4912C35.5662 55.3873 35.6835 55.3381 35.788 55.3782C35.8925 55.4201 35.942 55.5368 35.9017 55.6408C35.8595 55.7447 35.7422 55.794 35.6377 55.7538C35.5332 55.7119 35.4837 55.5952 35.524 55.4912ZM35.9273 58.1391C35.8155 58.1482 35.7183 58.0643 35.7092 57.9531C35.7 57.8418 35.7843 57.7452 35.8962 57.7361C36.008 57.7269 36.1052 57.8108 36.1143 57.9221C36.1235 58.0333 36.0392 58.13 35.9273 58.1391ZM36.8934 56.2535C36.7853 56.2262 36.7193 56.1167 36.7468 56.0091C36.7743 55.9016 36.8843 55.8359 36.9924 55.8633C37.1006 55.8906 37.1666 56 37.1391 56.1076C37.1116 56.2152 37.0016 56.2809 36.8934 56.2535ZM37.2564 58.0388C37.1446 58.0497 37.0456 57.9677 37.0364 57.8564C37.0273 57.7452 37.1079 57.6467 37.2198 57.6376C37.3316 57.6285 37.4306 57.7087 37.4397 57.82C37.4489 57.9312 37.3683 58.0297 37.2564 58.0388ZM37.5901 53.1936C37.5076 53.2683 37.3793 53.261 37.3041 53.179C37.2289 53.0969 37.2363 52.9692 37.3188 52.8945C37.4013 52.8197 37.5296 52.827 37.6047 52.9091C37.6799 52.9911 37.6726 53.1188 37.5901 53.1936ZM38.2005 56.5817C38.0905 56.5653 38.0135 56.4614 38.0319 56.352C38.0484 56.2426 38.1529 56.166 38.2629 56.1842C38.3729 56.2006 38.4499 56.3046 38.4315 56.414C38.415 56.5234 38.3105 56.6 38.2005 56.5817ZM38.5782 57.9184C38.4664 57.9294 38.3674 57.8473 38.3564 57.7361C38.3454 57.6248 38.4279 57.5264 38.5397 57.5154C38.6515 57.5045 38.7505 57.5865 38.7615 57.6978C38.7725 57.809 38.69 57.9075 38.5782 57.9184ZM42.318 48.7404C42.4298 48.7459 42.516 48.8425 42.5086 48.9538C42.5031 49.065 42.406 49.1507 42.2941 49.1434C42.1823 49.1361 42.0961 49.0413 42.1035 48.93C42.1108 48.8188 42.2061 48.7331 42.318 48.7404ZM42.1805 50.068C42.2886 50.0388 42.4005 50.1026 42.4298 50.2102C42.4591 50.3178 42.395 50.429 42.2868 50.4582C42.1786 50.4874 42.0668 50.4235 42.0375 50.316C42.0082 50.2084 42.0723 50.0971 42.1805 50.068ZM40.7359 52.993C40.8111 52.9091 40.9375 52.9018 41.0219 52.9765C41.1062 53.0513 41.1135 53.1771 41.0384 53.261C40.9632 53.3449 40.8367 53.3522 40.7524 53.2774C40.6681 53.2027 40.6607 53.0768 40.7359 52.993ZM39.68 50.584C39.7863 50.5512 39.8999 50.6096 39.9329 50.7171C39.9659 50.8247 39.9073 50.936 39.7991 50.9688C39.6928 51.0016 39.5791 50.9433 39.5461 50.8357C39.5131 50.7299 39.5718 50.6168 39.68 50.584ZM39.251 54.6925C39.2986 54.5922 39.4178 54.5485 39.5205 54.5941C39.6213 54.6415 39.6653 54.76 39.6195 54.8621C39.5718 54.9624 39.4526 55.0062 39.35 54.9606C39.2491 54.9132 39.2051 54.7946 39.251 54.6925ZM39.5241 56.7878C39.4123 56.7769 39.3316 56.6784 39.3426 56.5672C39.3536 56.4559 39.4526 56.3757 39.5645 56.3866C39.6763 56.3976 39.7569 56.496 39.746 56.6073C39.735 56.7185 39.636 56.7987 39.5241 56.7878ZM39.8999 57.7926C39.7881 57.8017 39.6891 57.7215 39.68 57.6102C39.6708 57.499 39.7514 57.4005 39.8633 57.3914C39.9751 57.3823 40.0741 57.4625 40.0833 57.5738C40.0924 57.685 40.0118 57.7835 39.8999 57.7926ZM40.2501 52.2034C40.1584 52.2672 40.0319 52.2435 39.9678 52.1505C39.9036 52.0593 39.9274 51.9335 40.0209 51.8696C40.1126 51.8058 40.2391 51.8295 40.3033 51.9225C40.3674 52.0137 40.3436 52.1395 40.2501 52.2034ZM40.5764 55.5259C40.4701 55.4912 40.4114 55.3782 40.4462 55.2724C40.4811 55.1667 40.5947 55.1083 40.7011 55.1429C40.8074 55.1776 40.866 55.2907 40.8312 55.3964C40.7964 55.5022 40.6827 55.5605 40.5764 55.5259ZM40.8532 56.9155C40.7414 56.9082 40.6571 56.8133 40.6626 56.7021C40.6699 56.5909 40.7652 56.507 40.877 56.5124C40.9889 56.5197 41.0732 56.6146 41.0677 56.7258C41.0604 56.837 40.965 56.9209 40.8532 56.9155ZM41.2199 57.6759C41.108 57.685 41.0109 57.6011 41.0017 57.4899C40.9925 57.3786 41.0769 57.282 41.1887 57.2729C41.3005 57.2638 41.3977 57.3476 41.4069 57.4589C41.416 57.5701 41.3317 57.6668 41.2199 57.6759ZM41.7057 53.9011C41.7643 53.8063 41.889 53.7753 41.9843 53.8336C42.0796 53.892 42.1108 54.016 42.0521 54.1108C41.9935 54.2056 41.8688 54.2366 41.7735 54.1783C41.6782 54.1199 41.647 53.9959 41.7057 53.9011ZM41.8578 55.9344C41.7497 55.9088 41.6818 55.8013 41.7057 55.6918C41.7313 55.5843 41.8395 55.5168 41.9495 55.5405C42.0576 55.566 42.1255 55.6736 42.1016 55.783C42.076 55.8906 41.9678 55.9581 41.8578 55.9344ZM42.1823 56.9957C42.0705 56.992 41.9843 56.8972 41.988 56.786C41.9916 56.6747 42.087 56.589 42.1988 56.5927C42.3106 56.5963 42.3968 56.6912 42.3931 56.8024C42.3895 56.9136 42.2941 56.9993 42.1823 56.9957ZM42.6864 51.7073C42.5911 51.7657 42.4665 51.7365 42.4078 51.6417C42.3491 51.5469 42.3785 51.4229 42.4738 51.3645C42.5691 51.3062 42.6938 51.3353 42.7524 51.4302C42.8111 51.525 42.7818 51.649 42.6864 51.7073ZM42.8294 54.6086C42.8734 54.5065 42.9944 54.4609 43.0971 54.5047C43.1997 54.5485 43.2456 54.6688 43.2016 54.7709C43.1576 54.8731 43.0366 54.9187 42.9339 54.8749C42.8313 54.8311 42.7854 54.7108 42.8294 54.6086ZM43.1613 56.2353C43.0513 56.2152 42.9779 56.1113 42.9963 56.0019C43.0164 55.8924 43.1209 55.8195 43.2309 55.8377C43.3409 55.856 43.4142 55.9617 43.3959 56.0711C43.3757 56.1806 43.2712 56.2535 43.1613 56.2353ZM43.4179 52.8051C43.3391 52.8835 43.2107 52.8835 43.1319 52.8051C43.0531 52.7267 43.0531 52.5991 43.1319 52.5207C43.2107 52.4422 43.3391 52.4422 43.4179 52.5207C43.4967 52.5991 43.4967 52.7267 43.4179 52.8051ZM57.0754 44.1559C57.1543 44.2344 57.1524 44.362 57.0754 44.4404C56.9984 44.5188 56.8683 44.517 56.7895 44.4404C56.7106 44.3638 56.7125 44.2344 56.7895 44.1559C56.8683 44.0775 56.9966 44.0793 57.0754 44.1559ZM56.5878 22.3315C56.6831 22.2749 56.8078 22.3059 56.8665 22.4008C56.9233 22.4956 56.8921 22.6196 56.7968 22.6779C56.7015 22.7363 56.5768 22.7035 56.5181 22.6086C56.4613 22.5138 56.4925 22.3898 56.5878 22.3315ZM56.3073 43.8204C56.3916 43.7475 56.52 43.7548 56.5933 43.8386C56.6666 43.9225 56.6593 44.0502 56.575 44.1231C56.4906 44.1961 56.3623 44.1888 56.289 44.1049C56.2157 44.021 56.223 43.8933 56.3073 43.8204ZM55.9278 21.1863C56.0305 21.1407 56.1497 21.1863 56.1955 21.2866C56.2413 21.3868 56.1955 21.5072 56.0947 21.5528C55.992 21.5984 55.8728 21.5528 55.827 21.4525C55.7812 21.3522 55.827 21.2318 55.9278 21.1863ZM55.9737 43.5651C56.0415 43.6526 56.0268 43.7803 55.9388 43.8478C55.8508 43.9152 55.7225 43.9006 55.6547 43.8131C55.5869 43.7256 55.6015 43.5979 55.6895 43.5305C55.7775 43.463 55.9058 43.4776 55.9737 43.5651ZM55.3962 19.9772C55.5025 19.9408 55.618 19.9973 55.6547 20.1012C55.6914 20.207 55.6345 20.3219 55.53 20.3584C55.4237 20.3948 55.3082 20.3383 55.2715 20.2344C55.2349 20.1304 55.2917 20.0137 55.3962 19.9772ZM54.9746 18.7263C55.0827 18.6971 55.1945 18.7609 55.222 18.8685C55.2514 18.9761 55.1872 19.0873 55.0791 19.1147C54.9709 19.1439 54.8591 19.08 54.8316 18.9724C54.8022 18.8649 54.8664 18.7536 54.9746 18.7263ZM54.6446 17.4461C54.7546 17.4242 54.8609 17.4935 54.8847 17.6029C54.9067 17.7124 54.8371 17.8181 54.7271 17.8418C54.6171 17.8637 54.5108 17.7944 54.4869 17.685C54.4649 17.5756 54.5346 17.4698 54.6446 17.4461ZM54.4026 45.7443C54.4594 45.6476 54.5822 45.6148 54.6794 45.6713C54.7766 45.7279 54.8096 45.85 54.7527 45.9467C54.6959 46.0433 54.5731 46.0762 54.4759 46.0196C54.3788 45.9631 54.3458 45.8409 54.4026 45.7443ZM54.3146 23.442C54.3348 23.5514 54.2614 23.6572 54.1514 23.6754C54.0415 23.6955 53.9351 23.6225 53.9168 23.5131C53.8966 23.4037 53.97 23.298 54.0799 23.2797C54.1899 23.2597 54.2963 23.3326 54.3146 23.442ZM53.8013 44.3511C53.728 44.2672 53.7353 44.1395 53.8196 44.0666C53.904 43.9936 54.0323 44.0009 54.1056 44.0848C54.1789 44.1687 54.1716 44.2964 54.0873 44.3693C54.003 44.4422 53.8746 44.4349 53.8013 44.3511ZM53.9993 45.5546C53.9351 45.6458 53.8086 45.6677 53.717 45.6039C53.6253 45.54 53.6033 45.4142 53.6675 45.323C53.7316 45.2318 53.8581 45.21 53.9498 45.2738C54.0415 45.3376 54.0634 45.4634 53.9993 45.5546ZM54.0818 22.1527C54.0946 22.264 54.0158 22.3643 53.904 22.377C53.7921 22.3898 53.6913 22.3114 53.6785 22.2002C53.6656 22.0889 53.7445 21.9886 53.8563 21.9759C53.9681 21.9631 54.0689 22.0415 54.0818 22.1527ZM53.926 20.8507C53.9351 20.962 53.8508 21.0586 53.739 21.0677C53.6271 21.0768 53.53 20.993 53.5208 20.8817C53.5117 20.7705 53.596 20.6738 53.7078 20.6647C53.8196 20.6556 53.9168 20.7395 53.926 20.8507ZM53.6326 19.7493C53.5208 19.7548 53.4255 19.669 53.42 19.5578C53.4145 19.4466 53.5006 19.3517 53.6125 19.3463C53.7243 19.3408 53.8196 19.4265 53.8251 19.5377C53.8306 19.649 53.7445 19.7438 53.6326 19.7493ZM53.5666 18.4308C53.4548 18.4345 53.3613 18.347 53.3577 18.2357C53.354 18.1245 53.442 18.0315 53.5538 18.0278C53.6656 18.0242 53.7591 18.1117 53.7628 18.223C53.7665 18.3342 53.6785 18.4272 53.5666 18.4308ZM53.5171 16.7057C53.629 16.7039 53.7225 16.7915 53.7243 16.9027C53.7261 17.0139 53.6381 17.1069 53.5263 17.1088C53.4145 17.1106 53.321 17.023 53.3192 16.9118C53.3173 16.8006 53.4053 16.7076 53.5171 16.7057ZM50.0303 48.1386C50.0212 48.2499 49.9222 48.3319 49.8104 48.321C49.6985 48.3119 49.616 48.2134 49.627 48.1021C49.638 47.9909 49.7352 47.9088 49.847 47.9198C49.9589 47.9307 50.0414 48.0274 50.0303 48.1386ZM49.5959 45.4233C49.6655 45.3358 49.792 45.3212 49.88 45.3905C49.968 45.4598 49.9827 45.5856 49.913 45.6731C49.8434 45.7607 49.7169 45.7753 49.6289 45.706C49.5409 45.6367 49.5262 45.5109 49.5959 45.4233ZM49.6765 49.2382C49.7865 49.22 49.891 49.2929 49.9112 49.4024C49.9295 49.5118 49.8562 49.6157 49.7462 49.6358C49.6362 49.654 49.5317 49.5811 49.5115 49.4716C49.4932 49.3622 49.5665 49.2583 49.6765 49.2382ZM48.4024 47.5824C48.5124 47.6025 48.5858 47.7064 48.5674 47.8158C48.5473 47.9253 48.4428 47.9982 48.3328 47.98C48.2228 47.9599 48.1495 47.856 48.1678 47.7465C48.188 47.6371 48.2924 47.5642 48.4024 47.5824ZM46.5454 47.515C46.5747 47.4074 46.6847 47.3435 46.7929 47.3709C46.901 47.4001 46.9652 47.5095 46.9377 47.6171C46.9084 47.7247 46.7984 47.7885 46.6902 47.7611C46.5821 47.732 46.5179 47.6225 46.5454 47.515ZM46.5087 50.3561C46.4024 50.3907 46.2887 50.3324 46.2539 50.2266C46.2191 50.1208 46.2777 50.0078 46.3841 49.9731C46.4904 49.9385 46.604 49.9968 46.6389 50.1026C46.6737 50.2084 46.615 50.3214 46.5087 50.3561ZM44.4848 48.5744C44.5967 48.5781 44.6847 48.6693 44.6828 48.7805C44.6792 48.8918 44.5875 48.9793 44.4757 48.9775C44.3638 48.9738 44.2759 48.8826 44.2777 48.7714C44.2814 48.6602 44.373 48.5726 44.4848 48.5744ZM44.3913 49.902C44.4995 49.871 44.6113 49.933 44.6425 50.0406C44.6737 50.1482 44.6113 50.2594 44.5032 50.2904C44.395 50.3214 44.2832 50.2594 44.252 50.1518C44.2209 50.0442 44.2832 49.933 44.3913 49.902ZM44.0449 53.4817C44.109 53.3905 44.2355 53.3686 44.3272 53.4306C44.4188 53.4944 44.4408 53.6203 44.3785 53.7114C44.3143 53.8026 44.1879 53.8245 44.0962 53.7625C44.0045 53.6987 43.9825 53.5729 44.0449 53.4817ZM44.1677 55.4092C44.0614 55.3745 44.0045 55.2597 44.0394 55.1539C44.0742 55.0481 44.1897 54.9916 44.296 55.0262C44.4023 55.0609 44.4592 55.1758 44.4243 55.2815C44.3895 55.3873 44.274 55.4438 44.1677 55.4092ZM44.4757 56.4669C44.3657 56.4504 44.2887 56.3483 44.3033 56.2389C44.3198 56.1295 44.4225 56.0529 44.5325 56.0675C44.6425 56.0821 44.7195 56.186 44.7048 56.2954C44.6883 56.4049 44.5857 56.4814 44.4757 56.4669ZM44.9138 51.5396C44.8185 51.5979 44.6938 51.5669 44.6352 51.4721C44.5765 51.3773 44.6077 51.2533 44.703 51.1949C44.7983 51.1366 44.923 51.1676 44.9816 51.2624C45.0403 51.3572 45.0091 51.4812 44.9138 51.5396ZM44.8423 47.7174C44.736 47.6809 44.6792 47.5678 44.7158 47.4621C44.7525 47.3563 44.8662 47.2998 44.9725 47.3362C45.0788 47.3727 45.1356 47.4858 45.099 47.5915C45.0623 47.6973 44.9486 47.7538 44.8423 47.7174ZM45.209 54.5321C45.11 54.481 45.0715 54.3588 45.1228 54.2603C45.1741 54.1619 45.297 54.1236 45.396 54.1746C45.4949 54.2257 45.5334 54.3479 45.4821 54.4463C45.4308 54.5448 45.308 54.5831 45.209 54.5321ZM45.6874 55.6882C45.6581 55.7958 45.5481 55.8596 45.4399 55.8304C45.3318 55.8013 45.2676 55.6918 45.297 55.5843C45.3263 55.4767 45.4363 55.4128 45.5444 55.442C45.6526 55.4712 45.7168 55.5806 45.6874 55.6882ZM45.6361 52.6428C45.5554 52.7194 45.4271 52.7158 45.3501 52.6355C45.2731 52.5553 45.2768 52.4277 45.3575 52.3511C45.4381 52.2745 45.5664 52.2781 45.6434 52.3584C45.7204 52.4386 45.7168 52.5662 45.6361 52.6428ZM46.3969 48.6419C46.5087 48.6383 46.6022 48.7258 46.6059 48.837C46.6095 48.9483 46.5216 49.0413 46.4097 49.0449C46.2979 49.0486 46.2044 48.961 46.2007 48.8498C46.1971 48.7386 46.2851 48.6456 46.3969 48.6419ZM46.2484 53.3321C46.3162 53.2428 46.4427 53.2245 46.5326 53.292C46.6224 53.3595 46.6407 53.4853 46.5729 53.5747C46.5051 53.664 46.3786 53.6823 46.2887 53.6148C46.1989 53.5473 46.1806 53.4215 46.2484 53.3321ZM46.6682 55.0372C46.626 55.1411 46.5069 55.1904 46.4042 55.1466C46.3016 55.1028 46.2502 54.9861 46.2942 54.884C46.3364 54.7801 46.4556 54.7308 46.5582 54.7746C46.6627 54.8165 46.7122 54.9351 46.6682 55.0372ZM46.9634 51.5925C46.868 51.6508 46.7434 51.6235 46.6847 51.5286C46.626 51.4338 46.6535 51.3098 46.7489 51.2514C46.8442 51.1931 46.9689 51.2204 47.0275 51.3153C47.0862 51.4101 47.0587 51.5341 46.9634 51.5925ZM47.2328 46.3242C47.2897 46.2275 47.4125 46.1947 47.5097 46.2512C47.6068 46.3078 47.6398 46.4299 47.583 46.5266C47.5262 46.6232 47.4033 46.6561 47.3062 46.5995C47.209 46.543 47.176 46.4208 47.2328 46.3242ZM47.649 54.3479C47.5922 54.4445 47.4693 54.4773 47.3722 54.4208C47.275 54.3643 47.242 54.2421 47.2988 54.1455C47.3557 54.0488 47.4785 54.016 47.5757 54.0725C47.6728 54.129 47.7058 54.2512 47.649 54.3479ZM47.6985 52.6866C47.6178 52.7632 47.4895 52.7595 47.4125 52.6775C47.3355 52.5972 47.3392 52.4696 47.4217 52.393C47.5023 52.3164 47.6307 52.3201 47.7076 52.4021C47.7846 52.4824 47.781 52.61 47.6985 52.6866ZM47.935 49.1015C47.924 48.9902 48.0046 48.8917 48.1165 48.8808C48.2283 48.8699 48.3273 48.9501 48.3383 49.0613C48.3493 49.1726 48.2686 49.2711 48.1568 49.282C48.045 49.2929 47.946 49.2127 47.935 49.1015ZM48.0798 50.4673C48.0395 50.3634 48.0926 50.2467 48.1971 50.2084C48.3016 50.1701 48.4189 50.2211 48.4574 50.3251C48.4959 50.429 48.4446 50.5457 48.3401 50.584C48.2356 50.6241 48.1183 50.5713 48.0798 50.4673ZM48.6279 53.6276C48.5583 53.7151 48.4318 53.7297 48.3438 53.6622C48.2558 53.5929 48.2411 53.4671 48.3089 53.3796C48.3786 53.292 48.5051 53.2774 48.5931 53.3449C48.6811 53.4142 48.6958 53.54 48.6279 53.6276ZM48.8498 51.7985C48.7563 51.8605 48.6298 51.8332 48.5693 51.7402C48.5088 51.6472 48.5344 51.5213 48.6279 51.4612C48.7214 51.3992 48.8479 51.4265 48.9084 51.5195C48.9707 51.6125 48.9432 51.7383 48.8498 51.7985ZM49.1156 46.6706C49.0679 46.7709 48.9469 46.8147 48.8461 46.7673C48.7453 46.7199 48.7013 46.5995 48.7489 46.4992C48.7966 46.3989 48.9176 46.3552 49.0184 46.4026C49.1192 46.45 49.1632 46.5703 49.1156 46.6706ZM49.6087 52.8817C49.528 52.9583 49.3997 52.9547 49.3227 52.8744C49.2457 52.7942 49.2494 52.6665 49.3301 52.59C49.4107 52.5134 49.539 52.517 49.616 52.5972C49.693 52.6775 49.6894 52.8051 49.6087 52.8817ZM50.0175 50.9232C49.9149 50.967 49.7957 50.9196 49.7517 50.8174C49.7077 50.7153 49.7554 50.5968 49.858 50.553C49.9607 50.5093 50.0798 50.5567 50.1238 50.6588C50.1678 50.7609 50.1202 50.8794 50.0175 50.9232ZM50.0908 46.8092C50.1293 46.7053 50.2448 46.6506 50.3512 46.6889C50.4575 46.7272 50.5107 46.8421 50.4722 46.9478C50.4337 47.0518 50.3182 47.1065 50.2118 47.0682C50.1055 47.0299 50.0523 46.915 50.0908 46.8092ZM50.5803 52.1158C50.4887 52.1796 50.3622 52.1559 50.298 52.0648C50.2338 51.9736 50.2577 51.8478 50.3493 51.7839C50.441 51.7201 50.5675 51.7438 50.6316 51.835C50.6958 51.9262 50.672 52.052 50.5803 52.1158ZM50.8406 45.6659C50.903 45.5729 51.0276 45.5473 51.1211 45.6075C51.2146 45.6677 51.2403 45.7935 51.1798 45.8865C51.1193 45.9795 50.9928 46.005 50.8993 45.9449C50.8058 45.8829 50.7801 45.7589 50.8406 45.6659ZM51.3503 48.5526C51.3503 48.6638 51.2586 48.7532 51.1468 48.7532C51.035 48.7532 50.9451 48.662 50.9451 48.5507C50.9451 48.4395 51.0368 48.3502 51.1486 48.3502C51.2604 48.3502 51.3503 48.4413 51.3503 48.5526ZM50.9433 49.9202C50.9176 49.8127 50.9836 49.7032 51.0918 49.6777C51.2 49.6522 51.3099 49.7178 51.3356 49.8254C51.3613 49.933 51.2953 50.0424 51.1871 50.068C51.079 50.0935 50.969 50.0278 50.9433 49.9202ZM51.5428 51.3372C51.4419 51.3864 51.3209 51.3445 51.2714 51.2442C51.2219 51.1439 51.2641 51.0235 51.3649 50.9743C51.4658 50.925 51.5868 50.967 51.6363 51.0673C51.6858 51.1676 51.6436 51.2879 51.5428 51.3372ZM51.6803 47.3253C51.6528 47.4329 51.5409 47.4967 51.4328 47.4694C51.3246 47.442 51.2604 47.3308 51.2879 47.2232C51.3154 47.1156 51.4273 47.0518 51.5354 47.0791C51.6436 47.1065 51.7078 47.2177 51.6803 47.3253ZM51.7902 44.6866C51.8691 44.6064 51.9974 44.6045 52.0762 44.683C52.1569 44.7614 52.1587 44.889 52.0799 44.9674C52.0011 45.0477 51.8727 45.0495 51.7939 44.9711C51.7132 44.8927 51.7114 44.765 51.7902 44.6866ZM52.0139 46.2877C51.9149 46.2348 51.8782 46.1126 51.9314 46.0142C51.9846 45.9157 52.1074 45.8792 52.2064 45.9321C52.3054 45.985 52.342 46.1072 52.2889 46.2056C52.2357 46.3041 52.1129 46.3406 52.0139 46.2877ZM52.1312 49.0559C52.1239 48.9446 52.2064 48.848 52.3182 48.8407C52.43 48.8334 52.5272 48.9155 52.5345 49.0267C52.5419 49.1379 52.4594 49.2346 52.3475 49.2419C52.2357 49.2492 52.1386 49.1671 52.1312 49.0559ZM52.4869 50.5494C52.3805 50.5822 52.2669 50.522 52.2339 50.4163C52.2009 50.3105 52.2614 50.1974 52.3677 50.1646C52.474 50.1318 52.5877 50.192 52.6207 50.2977C52.6537 50.4035 52.5932 50.5166 52.4869 50.5494ZM52.5199 47.938C52.4099 47.9198 52.3347 47.8158 52.353 47.7064C52.3714 47.597 52.4759 47.5223 52.5859 47.5405C52.6959 47.5587 52.771 47.6627 52.7527 47.7721C52.7344 47.8815 52.6299 47.9563 52.5199 47.938ZM52.8004 44.9638C52.8718 44.8781 53.0002 44.8653 53.0863 44.9364C53.1725 45.0075 53.1853 45.1352 53.1138 45.2209C53.0423 45.3066 52.914 45.3194 52.8279 45.2483C52.7417 45.1771 52.7289 45.0495 52.8004 44.9638ZM52.9947 46.7071C52.892 46.6633 52.8443 46.5448 52.8865 46.4427C52.9287 46.3406 53.0497 46.2932 53.1523 46.3351C53.255 46.3789 53.3027 46.4974 53.2605 46.5995C53.2165 46.7016 53.0973 46.7491 52.9947 46.7071ZM53.4127 49.7598C53.3027 49.7762 53.2 49.6996 53.1835 49.5884C53.167 49.4789 53.244 49.3768 53.3558 49.3604C53.4658 49.344 53.5685 49.4206 53.585 49.5318C53.6015 49.6412 53.5245 49.7434 53.4127 49.7598ZM53.4805 48.445C53.3687 48.4359 53.2862 48.3374 53.2953 48.2261C53.3045 48.1149 53.4035 48.0329 53.5153 48.042C53.6271 48.0511 53.7096 48.1496 53.7005 48.2608C53.6913 48.372 53.5923 48.4541 53.4805 48.445ZM53.8471 47.1794C53.7408 47.1448 53.6821 47.0317 53.717 46.9259C53.7518 46.8202 53.8655 46.7618 53.9718 46.7965C54.0781 46.8311 54.1368 46.9442 54.1019 47.0499C54.0671 47.1557 53.9535 47.2141 53.8471 47.1794ZM54.3073 48.9647C54.1954 48.9647 54.1056 48.8717 54.1074 48.7605C54.1074 48.6492 54.2009 48.5599 54.3128 48.5617C54.4246 48.5617 54.5144 48.6547 54.5126 48.7659C54.5126 48.8772 54.4191 48.9665 54.3073 48.9647ZM54.8169 47.5241C54.7912 47.6317 54.6812 47.6991 54.5731 47.6736C54.4649 47.6481 54.3971 47.5387 54.4228 47.4311C54.4484 47.3235 54.5584 47.256 54.6666 47.2815C54.7747 47.3071 54.8426 47.4165 54.8169 47.5241ZM54.9104 44.641C54.8316 44.7194 54.7032 44.7212 54.6244 44.6428C54.5456 44.5644 54.5438 44.4368 54.6226 44.3584C54.7014 44.2799 54.8297 44.2781 54.9086 44.3565C54.9874 44.4349 54.9892 44.5626 54.9104 44.641ZM55.3797 46.3752C55.3302 46.4755 55.2092 46.5175 55.1084 46.4701C55.0076 46.4226 54.9654 46.3005 55.0131 46.2002C55.0626 46.0999 55.1835 46.0579 55.2844 46.1053C55.3852 46.1527 55.4274 46.2749 55.3797 46.3752ZM55.3082 44.9966C55.2239 44.9237 55.2129 44.7978 55.2862 44.7121C55.3595 44.6282 55.486 44.6173 55.5722 44.6902C55.6584 44.7632 55.6675 44.889 55.5942 44.9747C55.5209 45.0586 55.3944 45.0695 55.3082 44.9966ZM55.8765 46.8129C55.8362 46.9168 55.717 46.9679 55.6144 46.9259C55.5099 46.8858 55.4585 46.7673 55.5007 46.6652C55.541 46.5612 55.6602 46.5102 55.7628 46.5521C55.8673 46.5922 55.9187 46.7108 55.8765 46.8129ZM56.1497 45.3467C56.0837 45.4361 55.9553 45.4543 55.8655 45.3887C55.7757 45.323 55.7574 45.1954 55.8233 45.106C55.8893 45.0167 56.0177 44.9984 56.1075 45.0641C56.1973 45.1297 56.2157 45.2574 56.1497 45.3467ZM56.2945 45.7972C56.201 45.737 56.1735 45.613 56.234 45.5181C56.2945 45.4251 56.4191 45.3978 56.5145 45.458C56.608 45.5181 56.6355 45.6421 56.575 45.737C56.5145 45.83 56.3898 45.8573 56.2945 45.7972Z" fill="#2BAEE4" />
                <path id="Vector_3" d="M19.0122 45.9613C19.751 45.4288 20.0737 44.5407 19.883 43.5961C19.7217 42.7919 19.4962 42.0187 19.2817 41.2729C18.8252 39.69 18.5833 38.3096 18.8747 37.3449C19.1112 36.5535 20.4715 35.9827 22.312 35.4849L30.1252 33.3713C31.6578 35.8824 34.646 37.2045 37.5498 36.4185C37.5681 36.4131 37.5993 36.4058 37.5993 36.4058L46.7489 33.9312L46.1458 31.7283L52.2523 30.0761C52.9342 29.8828 53.3357 29.1808 53.1487 28.4988C52.9618 27.8167 52.2596 27.4137 51.5703 27.5852L45.4657 29.2373L44.4336 25.4625L50.5401 23.8104L50.5327 23.8031C51.2147 23.6098 51.6162 22.9077 51.4292 22.2257C51.2422 21.5437 50.5401 21.1407 49.8526 21.3121L43.7461 22.9642L43.143 20.7614L33.9934 23.2359C33.975 23.2414 33.9622 23.2451 33.9439 23.2487C31.04 24.0347 29.1371 26.6788 29.0913 29.6111L21.2781 31.7247C18.3156 32.5252 16.4109 33.7397 15.4448 35.4374C14.3045 37.4415 14.7775 39.5988 15.3274 41.5756C13.5217 40.6875 10.99 39.3271 8.79199 38.1181C9.19164 40.0146 9.80027 41.8345 10.5941 43.5523C15.9434 46.4263 17.6153 46.9752 19.0122 45.9631V45.9613ZM50.1459 22.3424C50.1881 22.2403 50.3072 22.191 50.4099 22.233C50.5126 22.2749 50.5621 22.3934 50.5199 22.4956C50.4777 22.5977 50.3586 22.6469 50.2559 22.605C50.1533 22.563 50.1038 22.4445 50.1459 22.3424Z" fill="white" />
                <path id="Vector_4" d="M50.2559 22.605C50.3586 22.6469 50.4777 22.5977 50.5199 22.4956C50.5621 22.3935 50.5126 22.2749 50.4099 22.233C50.3072 22.191 50.1881 22.2403 50.1459 22.3424C50.1037 22.4445 50.1532 22.5631 50.2559 22.605Z" fill="#91D7EC" />
                <path id="Vector_5" d="M50.9089 21.0075C50.8044 20.9692 50.687 21.024 50.6485 21.1279C50.61 21.2318 50.665 21.3485 50.7695 21.3868C50.874 21.4251 50.9913 21.3704 51.0298 21.2665C51.0683 21.1625 51.0133 21.0458 50.9089 21.0075Z" fill="#91D7EC" />
                <path id="Vector_6" d="M51.3525 19.7638C51.2462 19.731 51.1325 19.7894 51.0995 19.8969C51.0665 20.0045 51.1252 20.1158 51.2333 20.1486C51.3397 20.1814 51.4533 20.1231 51.4863 20.0155C51.5193 19.9079 51.4607 19.7966 51.3525 19.7638Z" fill="#91D7EC" />
                <path id="Vector_7" d="M51.7354 18.4983C51.6273 18.4691 51.5154 18.5347 51.4879 18.6423C51.4586 18.7499 51.5246 18.8593 51.6328 18.8885C51.7409 18.9177 51.8527 18.852 51.8802 18.7445C51.9077 18.6369 51.8436 18.5256 51.7354 18.4983Z" fill="#91D7EC" />
                <path id="Vector_8" d="M52.0675 17.22C51.9575 17.1963 51.8494 17.2656 51.8274 17.375C51.8054 17.4844 51.8732 17.592 51.9832 17.6139C52.0932 17.6376 52.2014 17.5683 52.2234 17.4589C52.2472 17.3495 52.1775 17.2419 52.0675 17.22Z" fill="#91D7EC" />
                <path id="Vector_9" d="M52.3385 15.9289C52.2285 15.9088 52.124 15.9836 52.1039 16.093C52.0837 16.2024 52.1589 16.3063 52.2688 16.3264C52.3788 16.3465 52.4833 16.2717 52.5035 16.1623C52.5237 16.0529 52.4485 15.9489 52.3385 15.9289Z" fill="#91D7EC" />
                <path id="Vector_10" d="M52.5624 14.625C52.4524 14.6104 52.3497 14.687 52.3332 14.7964C52.3167 14.9058 52.3956 15.008 52.5056 15.0244C52.6156 15.039 52.7182 14.9624 52.7347 14.853C52.7494 14.7435 52.6724 14.6414 52.5624 14.625Z" fill="#91D7EC" />
                <path id="Vector_11" d="M52.6888 13.715C52.7988 13.7296 52.9014 13.653 52.9179 13.5436C52.9326 13.4342 52.8556 13.3321 52.7456 13.3157C52.6356 13.3011 52.5329 13.3777 52.5164 13.4871C52.5018 13.5965 52.5788 13.6986 52.6888 13.715Z" fill="#91D7EC" />
                <path id="Vector_12" d="M46.7474 20.1176C46.6557 20.1814 46.6337 20.3072 46.6979 20.3984C46.762 20.4896 46.8885 20.5115 46.9802 20.4477C47.0718 20.3838 47.0938 20.258 47.0297 20.1668C46.9655 20.0757 46.839 20.0538 46.7474 20.1176Z" fill="#91D7EC" />
                <path id="Vector_13" d="M47.8104 19.3754C47.7298 19.452 47.7261 19.5797 47.8031 19.6599C47.8801 19.7401 48.0084 19.7438 48.0891 19.6672C48.1697 19.5906 48.1734 19.463 48.0964 19.3827C48.0194 19.3025 47.8911 19.2988 47.8104 19.3754Z" fill="#91D7EC" />
                <path id="Vector_14" d="M48.7565 18.4855C48.685 18.5713 48.6997 18.6989 48.7859 18.77C48.872 18.8411 49.0004 18.8266 49.0719 18.7408C49.1434 18.6551 49.1287 18.5275 49.0425 18.4564C48.9564 18.3853 48.828 18.3998 48.7565 18.4855Z" fill="#91D7EC" />
                <path id="Vector_15" d="M49.8619 17.4169C49.7665 17.3567 49.6419 17.3841 49.5814 17.4789C49.5209 17.5737 49.5484 17.6977 49.6437 17.7579C49.739 17.8181 49.8637 17.7907 49.9242 17.6959C49.9847 17.6011 49.9572 17.4771 49.8619 17.4169Z" fill="#91D7EC" />
                <path id="Vector_16" d="M50.5551 16.2936C50.4543 16.2443 50.3333 16.2845 50.2838 16.3848C50.2343 16.4851 50.2746 16.6054 50.3755 16.6547C50.4763 16.7039 50.5973 16.6638 50.6468 16.5635C50.6963 16.4632 50.656 16.3428 50.5551 16.2936Z" fill="#91D7EC" />
                <path id="Vector_17" d="M51.2459 15.3654C51.2862 15.2614 51.2349 15.1447 51.1304 15.1046C51.0259 15.0645 50.9086 15.1156 50.8682 15.2195C50.8279 15.3234 50.8792 15.4402 50.9837 15.4803C51.0882 15.5204 51.2056 15.4693 51.2459 15.3654Z" fill="#91D7EC" />
                <path id="Vector_18" d="M51.4806 14.2549C51.5869 14.2877 51.7006 14.2275 51.7336 14.1199C51.7666 14.0142 51.7061 13.9011 51.5979 13.8683C51.4916 13.8354 51.3779 13.8956 51.3449 14.0032C51.3119 14.109 51.3724 14.222 51.4806 14.2549Z" fill="#91D7EC" />
                <path id="Vector_19" d="M51.8673 12.9893C51.9736 13.0221 52.0873 12.9619 52.1203 12.8544C52.1533 12.7486 52.0928 12.6355 51.9846 12.6027C51.8783 12.5699 51.7647 12.6301 51.7317 12.7377C51.6987 12.8434 51.7592 12.9565 51.8673 12.9893Z" fill="#91D7EC" />
                <path id="Vector_20" d="M44.1897 17.364C44.0797 17.3804 44.0028 17.4826 44.0174 17.592C44.0339 17.7014 44.1366 17.778 44.2466 17.7634C44.3566 17.747 44.4336 17.6449 44.4189 17.5354C44.4024 17.426 44.2997 17.3494 44.1897 17.364Z" fill="#91D7EC" />
                <path id="Vector_21" d="M45.4657 17.1871C45.3594 17.2254 45.3044 17.3403 45.3429 17.4443C45.3813 17.55 45.4968 17.6029 45.6013 17.5665C45.7077 17.5282 45.7627 17.4133 45.7242 17.3093C45.6857 17.2036 45.5702 17.1489 45.4657 17.1871Z" fill="#91D7EC" />
                <path id="Vector_22" d="M46.8867 17.1069C46.9838 17.0504 47.015 16.9264 46.9582 16.8315C46.9013 16.7349 46.7767 16.7039 46.6814 16.7604C46.5842 16.8169 46.553 16.9409 46.6099 17.0358C46.6667 17.1306 46.7913 17.1634 46.8867 17.1069Z" fill="#91D7EC" />
                <path id="Vector_23" d="M48.0598 16.4176C48.1442 16.3447 48.1552 16.2188 48.0818 16.1331C48.0085 16.0493 47.882 16.0383 47.7959 16.1113C47.7115 16.1842 47.7005 16.31 47.7739 16.3957C47.8472 16.4796 47.9737 16.4906 48.0598 16.4176Z" fill="#91D7EC" />
                <path id="Vector_24" d="M48.7857 15.276C48.7124 15.3599 48.7215 15.4876 48.8077 15.5605C48.892 15.6334 49.0204 15.6243 49.0937 15.5386C49.167 15.4547 49.1579 15.3271 49.0717 15.2541C48.9874 15.1812 48.859 15.1903 48.7857 15.276Z" fill="#91D7EC" />
                <path id="Vector_25" d="M49.9132 14.2348C49.8197 14.1746 49.6932 14.202 49.6327 14.295C49.5722 14.388 49.5997 14.5138 49.6932 14.574C49.7867 14.6342 49.9132 14.6068 49.9737 14.5138C50.0342 14.4208 50.0067 14.295 49.9132 14.2348Z" fill="#91D7EC" />
                <path id="Vector_26" d="M50.4355 13.4762C50.5364 13.5254 50.6574 13.4835 50.7069 13.3832C50.7564 13.2829 50.7142 13.1625 50.6134 13.1133C50.5125 13.0641 50.3915 13.106 50.342 13.2063C50.2925 13.3066 50.3347 13.4269 50.4355 13.4762Z" fill="#91D7EC" />
                <path id="Vector_27" d="M51.0205 12.2909C51.1213 12.3401 51.2423 12.2982 51.2918 12.1979C51.3413 12.0976 51.2991 11.9772 51.1983 11.928C51.0975 11.8788 50.9765 11.9207 50.927 12.021C50.8775 12.1213 50.9197 12.2416 51.0205 12.2909Z" fill="#91D7EC" />
                <path id="Vector_28" d="M42.3971 14.6524C42.2871 14.6305 42.1808 14.7016 42.1588 14.811C42.1368 14.9205 42.2083 15.0262 42.3183 15.0481C42.4282 15.07 42.5346 14.9989 42.5566 14.8895C42.5786 14.78 42.5071 14.6743 42.3971 14.6524Z" fill="#91D7EC" />
                <path id="Vector_29" d="M43.6583 14.9077C43.5465 14.9077 43.4567 15.0007 43.4585 15.1119C43.4585 15.2232 43.552 15.3125 43.6638 15.3107C43.7757 15.3107 43.8655 15.2177 43.8637 15.1064C43.8637 14.9952 43.7702 14.9059 43.6583 14.9077Z" fill="#91D7EC" />
                <path id="Vector_30" d="M44.9418 14.8968C44.8318 14.9223 44.7639 15.0299 44.7896 15.1375C44.8153 15.2469 44.9234 15.3144 45.0316 15.2888C45.1416 15.2633 45.2094 15.1557 45.1837 15.0481C45.1581 14.9387 45.0499 14.8712 44.9418 14.8968Z" fill="#91D7EC" />
                <path id="Vector_31" d="M46.1975 14.6159C46.0967 14.6633 46.0508 14.7819 46.0985 14.884C46.1462 14.9861 46.2653 15.0299 46.368 14.9825C46.4707 14.935 46.5146 14.8165 46.467 14.7144C46.4193 14.6123 46.3002 14.5685 46.1975 14.6159Z" fill="#91D7EC" />
                <path id="Vector_32" d="M47.3707 14.0834C47.2791 14.1491 47.2589 14.2749 47.3249 14.3643C47.3909 14.4554 47.5174 14.4755 47.6072 14.4099C47.6989 14.3442 47.7191 14.2184 47.6531 14.129C47.5871 14.0378 47.4606 14.0178 47.3707 14.0834Z" fill="#91D7EC" />
                <path id="Vector_33" d="M48.707 13.3303C48.6264 13.2519 48.4981 13.2537 48.4211 13.3339C48.3441 13.4142 48.3441 13.5418 48.4247 13.6184C48.5054 13.695 48.6337 13.695 48.7107 13.6147C48.7877 13.5345 48.7877 13.4069 48.707 13.3303Z" fill="#91D7EC" />
                <path id="Vector_34" d="M49.6125 12.3656C49.5208 12.3 49.3943 12.3219 49.3301 12.4131C49.2641 12.5042 49.2861 12.6301 49.3778 12.6939C49.4695 12.7595 49.596 12.7377 49.6601 12.6465C49.7261 12.5553 49.7041 12.4295 49.6125 12.3656Z" fill="#91D7EC" />
                <path id="Vector_35" d="M50.4301 11.5724C50.4961 11.4812 50.4741 11.3554 50.3825 11.2916C50.2908 11.2259 50.1643 11.2478 50.1002 11.339C50.0342 11.4301 50.0562 11.556 50.1478 11.6198C50.2395 11.6854 50.366 11.6636 50.4301 11.5724Z" fill="#91D7EC" />
                <path id="Vector_36" d="M41.0862 12.2361C40.9835 12.1905 40.8644 12.2361 40.8186 12.3382C40.7727 12.4404 40.8186 12.5589 40.9212 12.6045C41.0239 12.6501 41.143 12.6045 41.1889 12.5024C41.2347 12.4002 41.1889 12.2817 41.0862 12.2361Z" fill="#91D7EC" />
                <path id="Vector_37" d="M42.4152 12.9984C42.4409 12.8908 42.373 12.7814 42.2649 12.7559C42.1567 12.7304 42.0467 12.7978 42.0211 12.9054C41.9954 13.013 42.0632 13.1224 42.1714 13.148C42.2795 13.1735 42.3895 13.106 42.4152 12.9984Z" fill="#91D7EC" />
                <path id="Vector_38" d="M43.7152 13.261C43.7171 13.1498 43.6291 13.0568 43.5172 13.055C43.4054 13.0531 43.3119 13.1407 43.3101 13.2519C43.3083 13.3631 43.3962 13.4561 43.5081 13.458C43.6199 13.4598 43.7134 13.3723 43.7152 13.261Z" fill="#91D7EC" />
                <path id="Vector_39" d="M45.037 13.25C45.015 13.1406 44.9086 13.0695 44.8005 13.0896C44.6905 13.1114 44.619 13.2172 44.6391 13.3266C44.6611 13.436 44.7675 13.5072 44.8756 13.4871C44.9838 13.467 45.0571 13.3595 45.037 13.2519V13.25Z" fill="#91D7EC" />
                <path id="Vector_40" d="M46.2231 13.2227C46.3258 13.179 46.3734 13.0604 46.3294 12.9583C46.2855 12.8562 46.1663 12.8088 46.0636 12.8525C45.961 12.8963 45.9133 13.0148 45.9573 13.117C46.0013 13.2191 46.1205 13.2665 46.2231 13.2227Z" fill="#91D7EC" />
                <path id="Vector_41" d="M47.4786 12.6847C47.5703 12.6209 47.5941 12.4969 47.5299 12.4039C47.4658 12.3127 47.3411 12.289 47.2476 12.3528C47.156 12.4167 47.1321 12.5407 47.1963 12.6337C47.2605 12.7248 47.3851 12.7486 47.4786 12.6847Z" fill="#91D7EC" />
                <path id="Vector_42" d="M48.599 11.9116C48.6778 11.8332 48.6778 11.7055 48.599 11.6271C48.5202 11.5487 48.3919 11.5487 48.313 11.6271C48.2342 11.7055 48.2342 11.8332 48.313 11.9116C48.3919 11.99 48.5202 11.99 48.599 11.9116Z" fill="#91D7EC" />
                <path id="Vector_43" d="M49.5409 10.9797C49.6197 10.9013 49.6197 10.7736 49.5409 10.6952C49.4621 10.6168 49.3338 10.6168 49.2549 10.6952C49.1761 10.7736 49.1761 10.9013 49.2549 10.9797C49.3338 11.0581 49.4621 11.0581 49.5409 10.9797Z" fill="#91D7EC" />
                <path id="Vector_44" d="M40.0359 10.1409C39.9406 10.0825 39.8159 10.1117 39.7573 10.2065C39.6986 10.3014 39.7279 10.4254 39.8232 10.4837C39.9186 10.5421 40.0432 10.5129 40.1019 10.4181C40.1606 10.3232 40.1312 10.1992 40.0359 10.1409Z" fill="#91D7EC" />
                <path id="Vector_45" d="M41.1393 10.8211C41.0367 10.7773 40.9175 10.8265 40.8735 10.9287C40.8295 11.0308 40.879 11.1493 40.9817 11.1931C41.0843 11.2368 41.2035 11.1876 41.2475 11.0855C41.2915 10.9834 41.242 10.8648 41.1393 10.8211Z" fill="#91D7EC" />
                <path id="Vector_46" d="M42.2392 11.7164C42.3492 11.7401 42.4574 11.6708 42.4812 11.5632C42.5051 11.4556 42.4354 11.3462 42.3272 11.3225C42.2172 11.2988 42.1091 11.3681 42.0852 11.4757C42.0614 11.5851 42.1311 11.6927 42.2392 11.7164Z" fill="#91D7EC" />
                <path id="Vector_47" d="M43.5778 12.0064C43.6896 12.0064 43.7812 11.9189 43.7831 11.8076C43.7849 11.6964 43.6951 11.6052 43.5833 11.6034C43.4714 11.6034 43.3798 11.6909 43.3779 11.8022C43.3779 11.9134 43.4659 12.0046 43.5778 12.0064Z" fill="#91D7EC" />
                <path id="Vector_48" d="M44.9488 12.0191C45.0588 11.9972 45.1285 11.8897 45.1065 11.7802C45.0845 11.6708 44.9763 11.6015 44.8663 11.6234C44.7563 11.6453 44.6866 11.7529 44.7086 11.8623C44.7306 11.9717 44.8388 12.041 44.9488 12.0191Z" fill="#91D7EC" />
                <path id="Vector_49" d="M46.2888 11.7383C46.3915 11.6927 46.4373 11.5742 46.3915 11.4721C46.3457 11.37 46.2265 11.3244 46.1239 11.37C46.0212 11.4156 45.9754 11.5341 46.0212 11.6362C46.067 11.7383 46.1862 11.7839 46.2888 11.7383Z" fill="#91D7EC" />
                <path id="Vector_50" d="M47.5394 11.1821C47.6311 11.1183 47.6512 10.9925 47.5871 10.9013C47.5229 10.8101 47.3964 10.79 47.3047 10.8539C47.2131 10.9177 47.1929 11.0435 47.2571 11.1347C47.3212 11.2259 47.4477 11.2459 47.5394 11.1821Z" fill="#91D7EC" />
                <path id="Vector_51" d="M48.6209 10.4162C48.7126 10.3524 48.7328 10.2266 48.6686 10.1354C48.6044 10.0442 48.4779 10.0242 48.3863 10.088C48.2946 10.1518 48.2745 10.2777 48.3386 10.3688C48.4028 10.46 48.5293 10.4801 48.6209 10.4162Z" fill="#91D7EC" />
                <path id="Vector_52" d="M38.8423 8.38297C38.7763 8.47233 38.7946 8.59815 38.8844 8.66563C38.9743 8.7331 39.1008 8.71304 39.1686 8.62368C39.2346 8.53433 39.2163 8.4085 39.1264 8.34103C39.0366 8.27538 38.9101 8.29362 38.8423 8.38297Z" fill="#91D7EC" />
                <path id="Vector_53" d="M40.1735 9.11056C40.0764 9.05585 39.9517 9.0905 39.8967 9.18715C39.8417 9.2838 39.8765 9.4078 39.9737 9.46251C40.0709 9.51722 40.1955 9.48257 40.2505 9.38592C40.3055 9.28927 40.2707 9.16527 40.1735 9.11056Z" fill="#91D7EC" />
                <path id="Vector_54" d="M41.3006 9.74879C41.1961 9.70867 41.0787 9.76155 41.0384 9.86549C40.9981 9.96944 41.0512 10.0861 41.1557 10.1263C41.2602 10.1664 41.3776 10.1135 41.4179 10.0096C41.4582 9.90561 41.4051 9.7889 41.3006 9.74879Z" fill="#91D7EC" />
                <path id="Vector_55" d="M42.507 10.2047C42.397 10.1846 42.2907 10.2576 42.2724 10.367C42.2522 10.4764 42.3255 10.5822 42.4355 10.6004C42.5455 10.6186 42.6519 10.5475 42.6702 10.4381C42.6904 10.3287 42.617 10.2229 42.507 10.2047Z" fill="#91D7EC" />
                <path id="Vector_56" d="M43.7717 10.4363C43.6599 10.44 43.5719 10.5311 43.5738 10.6424C43.5774 10.7536 43.6691 10.8411 43.7809 10.8393C43.8927 10.8357 43.9807 10.7445 43.9789 10.6333C43.9752 10.522 43.8836 10.4345 43.7717 10.4363Z" fill="#91D7EC" />
                <path id="Vector_57" d="M45.0569 10.4071C44.9487 10.4345 44.8827 10.5439 44.9084 10.6515C44.9359 10.7591 45.0459 10.8247 45.154 10.7992C45.2622 10.7718 45.3282 10.6624 45.3025 10.5548C45.275 10.4472 45.165 10.3816 45.0569 10.4071Z" fill="#91D7EC" />
                <path id="Vector_58" d="M46.5767 10.1955C46.5272 10.0953 46.4062 10.0551 46.3053 10.1025C46.2045 10.1518 46.1642 10.2721 46.2118 10.3724C46.2595 10.4727 46.3823 10.5128 46.4832 10.4654C46.584 10.4162 46.6243 10.2958 46.5767 10.1955Z" fill="#91D7EC" />
                <path id="Vector_59" d="M47.6765 9.8856C47.7773 9.83636 47.8177 9.71601 47.77 9.61571C47.7205 9.51542 47.5995 9.4753 47.4987 9.52271C47.3979 9.57012 47.3575 9.6923 47.4052 9.7926C47.4547 9.8929 47.5757 9.93301 47.6765 9.8856Z" fill="#91D7EC" />
                <path id="Vector_60" d="M38.0012 6.81465C37.9297 6.90036 37.9443 7.02801 38.0305 7.09913C38.1167 7.17025 38.245 7.15566 38.3165 7.06995C38.388 6.98424 38.3733 6.85659 38.2872 6.78547C38.201 6.71435 38.0727 6.72894 38.0012 6.81465Z" fill="#91D7EC" />
                <path id="Vector_61" d="M39.02 7.66265C38.9577 7.75565 38.9815 7.87966 39.075 7.94166C39.1685 8.00366 39.2931 7.97995 39.3555 7.88695C39.4178 7.79395 39.394 7.66995 39.3005 7.60795C39.207 7.54594 39.0823 7.56965 39.02 7.66265Z" fill="#91D7EC" />
                <path id="Vector_62" d="M40.3824 8.3337C40.2834 8.28264 40.1605 8.32276 40.1092 8.42306C40.0579 8.52153 40.0982 8.64371 40.199 8.69477C40.298 8.74583 40.4209 8.70571 40.4722 8.60541C40.5235 8.50694 40.4832 8.38476 40.3824 8.3337Z" fill="#91D7EC" />
                <path id="Vector_63" d="M41.5354 8.91906C41.4291 8.88441 41.3154 8.94276 41.2806 9.04853C41.2457 9.1543 41.3044 9.26736 41.4107 9.302C41.517 9.33665 41.6307 9.2783 41.6655 9.17253C41.7004 9.06676 41.6417 8.9537 41.5354 8.91906Z" fill="#91D7EC" />
                <path id="Vector_64" d="M42.7618 9.31846C42.65 9.30387 42.5491 9.38228 42.5345 9.49352C42.5198 9.60476 42.5986 9.70505 42.7105 9.71964C42.8223 9.73423 42.9231 9.65582 42.9378 9.54458C42.9524 9.43334 42.8736 9.33305 42.7618 9.31846Z" fill="#91D7EC" />
                <path id="Vector_65" d="M44.0709 9.88741C44.1827 9.87829 44.2652 9.78164 44.2561 9.67041C44.2469 9.55917 44.1497 9.47711 44.0379 9.48623C43.9261 9.49534 43.8436 9.59199 43.8527 9.70323C43.8619 9.81447 43.9591 9.89653 44.0709 9.88741Z" fill="#91D7EC" />
                <path id="Vector_66" d="M45.1837 9.63757C45.2167 9.74334 45.3304 9.80352 45.4367 9.7707C45.5412 9.73969 45.598 9.6321 45.5724 9.52816C45.5724 9.52451 45.5724 9.52087 45.5724 9.51904C45.5394 9.41328 45.4257 9.3531 45.3194 9.38592C45.3102 9.38775 45.3047 9.39504 45.2956 9.39869C45.2039 9.44063 45.1544 9.54092 45.1837 9.63757Z" fill="#91D7EC" />
                <path id="Vector_67" d="M46.7088 9.38593C46.8151 9.35311 46.8756 9.24004 46.8426 9.13428C46.8096 9.02851 46.6959 8.96833 46.5896 9.00116C46.4833 9.03398 46.4228 9.14704 46.4558 9.25281C46.4888 9.35858 46.6024 9.41875 46.7088 9.38593Z" fill="#91D7EC" />
                <path id="Vector_68" d="M37.3832 5.5546C37.4107 5.52178 37.4455 5.50354 37.484 5.49442C37.4675 5.48713 37.4492 5.47984 37.4327 5.46889C37.4089 5.45066 37.3924 5.42878 37.3796 5.40325C37.3136 5.39413 37.2439 5.41419 37.1962 5.46707C37.1229 5.55096 37.1339 5.67861 37.2182 5.75155C37.2622 5.78984 37.3191 5.80443 37.3741 5.79714C37.3227 5.72419 37.3227 5.62572 37.3814 5.5546H37.3832Z" fill="#91D7EC" />
                <path id="Vector_69" d="M38.4022 6.40071C38.4334 6.36423 38.4737 6.34418 38.5177 6.33506C38.5104 6.32594 38.5049 6.31865 38.4957 6.31135C38.4902 6.3077 38.4829 6.3077 38.4792 6.30406C38.4719 6.29859 38.4682 6.29129 38.4627 6.28582C38.3747 6.23476 38.2629 6.253 38.1987 6.33506C38.1309 6.42441 38.1492 6.55024 38.239 6.61771C38.2885 6.65418 38.3472 6.6633 38.4022 6.65236C38.3435 6.57942 38.3399 6.47547 38.4022 6.40071Z" fill="#91D7EC" />
                <path id="Vector_70" d="M39.3977 7.45112C39.4747 7.46023 39.5517 7.42741 39.5939 7.35811C39.6526 7.26329 39.6232 7.13928 39.5261 7.08093C39.4307 7.02258 39.3061 7.05175 39.2474 7.1484C39.1887 7.24505 39.2181 7.36723 39.3152 7.42559C39.3372 7.43835 39.3592 7.44564 39.3831 7.44929C39.3886 7.44929 39.3922 7.45111 39.3977 7.45294V7.45112Z" fill="#91D7EC" />
                <path id="Vector_71" d="M40.637 7.75566C40.5343 7.71007 40.4152 7.75566 40.3693 7.85778C40.3235 7.9599 40.3693 8.07843 40.472 8.12402C40.5747 8.16961 40.6938 8.12402 40.7396 8.0219C40.7855 7.91978 40.7396 7.80125 40.637 7.75566Z" fill="#91D7EC" />
                <path id="Vector_72" d="M41.8194 8.2863C41.7112 8.25712 41.5994 8.32277 41.5719 8.43036C41.5426 8.53795 41.6086 8.64919 41.7167 8.67654C41.8249 8.70572 41.9367 8.64007 41.9642 8.53248C41.9936 8.42489 41.9276 8.31365 41.8194 8.2863Z" fill="#91D7EC" />
                <path id="Vector_73" d="M43.0644 8.61635C42.9526 8.60905 42.8554 8.69294 42.8481 8.80418C42.8408 8.91541 42.9251 9.01206 43.0369 9.01936C43.1487 9.02665 43.2459 8.94277 43.2532 8.83153C43.2606 8.72029 43.1762 8.62364 43.0644 8.61635Z" fill="#91D7EC" />
                <path id="Vector_74" d="M44.4028 9.10506C44.4468 9.09959 44.4834 9.07588 44.5146 9.04671C44.5586 9.00294 44.5843 8.94276 44.5751 8.87712C44.5586 8.7677 44.4559 8.69111 44.3459 8.7057C44.2451 8.72029 44.1773 8.806 44.1755 8.90265C44.1755 8.91359 44.1718 8.9227 44.1755 8.93365C44.192 9.04306 44.2946 9.11965 44.4046 9.10506H44.4028Z" fill="#91D7EC" />
                <path id="Vector_75" d="M45.7187 8.91909C45.8287 8.90268 45.9057 8.80056 45.8911 8.69114C45.8746 8.58173 45.7719 8.50514 45.6619 8.51973C45.5519 8.53614 45.4749 8.63826 45.4896 8.74767C45.5061 8.85709 45.6087 8.93368 45.7187 8.91909Z" fill="#91D7EC" />
                <path id="Vector_76" d="M36.6057 4.42761C36.5342 4.4805 36.437 4.48232 36.3637 4.42761C36.36 4.48779 36.3802 4.54979 36.4297 4.59356C36.4425 4.6045 36.4572 4.60997 36.47 4.61726C36.5269 4.58991 36.5929 4.59538 36.6497 4.62456C36.6735 4.61362 36.6973 4.5972 36.7157 4.57532C36.7303 4.55709 36.7413 4.53703 36.7487 4.51697C36.7102 4.51332 36.6735 4.50056 36.6405 4.47503C36.6259 4.46226 36.6149 4.44585 36.6039 4.42944L36.6057 4.42761Z" fill="#91D7EC" />
                <path id="Vector_77" d="M37.6233 5.27922C37.5518 5.34669 37.4418 5.35581 37.3611 5.29199C37.3575 5.32846 37.3611 5.36675 37.3795 5.39958C37.3923 5.42328 37.4088 5.44699 37.4326 5.46522C37.4473 5.47799 37.4656 5.48346 37.484 5.49075C37.528 5.47799 37.5738 5.47981 37.616 5.49805C37.6545 5.48711 37.6911 5.46887 37.7186 5.43422C37.737 5.41234 37.748 5.38681 37.7553 5.36128C37.7241 5.35581 37.693 5.34669 37.6673 5.32481C37.649 5.31022 37.6361 5.29381 37.6233 5.27557V5.27922Z" fill="#91D7EC" />
                <path id="Vector_78" d="M38.681 6.08527C38.615 6.17097 38.494 6.19103 38.406 6.12903C38.4023 6.12538 38.4005 6.12174 38.3968 6.11991C38.3913 6.18192 38.4133 6.24392 38.4628 6.28768C38.4683 6.29315 38.472 6.30045 38.4793 6.30592C38.4848 6.30957 38.4903 6.30957 38.4958 6.31321C38.5086 6.32051 38.5233 6.3278 38.538 6.33145C38.5636 6.32962 38.5893 6.33145 38.615 6.33874C38.6718 6.33327 38.725 6.30592 38.7616 6.25486C38.7818 6.22568 38.791 6.19468 38.7946 6.16186C38.7745 6.15639 38.7543 6.15091 38.736 6.13815C38.714 6.12356 38.6956 6.10533 38.6828 6.08527H38.681Z" fill="#91D7EC" />
                <path id="Vector_79" d="M39.7936 6.79828C39.7881 6.81104 39.7844 6.82381 39.7771 6.83657C39.7129 6.92775 39.5865 6.94964 39.4948 6.88581C39.4911 6.88216 39.4875 6.87852 39.4838 6.87487C39.4765 6.95146 39.515 7.02987 39.5865 7.06999C39.6836 7.1247 39.8083 7.08823 39.8614 6.99158C39.8834 6.95328 39.8871 6.91134 39.8816 6.87122C39.8761 6.8694 39.8724 6.87122 39.8669 6.86757C39.8339 6.85116 39.8101 6.82563 39.7918 6.79828H39.7936Z" fill="#91D7EC" />
                <path id="Vector_80" d="M40.6573 7.46206C40.617 7.566 40.6683 7.68271 40.7728 7.72283C40.8773 7.76295 40.9946 7.71189 41.0349 7.60794C41.0588 7.54959 41.0478 7.48759 41.0185 7.43653C41.0001 7.42194 40.9855 7.40188 40.9726 7.38182C40.9561 7.36906 40.9396 7.35629 40.9195 7.34717C40.815 7.30706 40.6976 7.35812 40.6573 7.46206Z" fill="#91D7EC" />
                <path id="Vector_81" d="M42.043 8.20969C42.098 8.22063 42.153 8.20969 42.197 8.17869C42.2392 8.14951 42.2722 8.10575 42.2832 8.05286C42.3052 7.94345 42.2355 7.83768 42.1255 7.8158C42.0155 7.79392 41.9092 7.86321 41.8872 7.97263C41.8799 8.01275 41.8872 8.04922 41.9 8.08569C41.9239 8.14769 41.9752 8.19693 42.0448 8.21151L42.043 8.20969Z" fill="#91D7EC" />
                <path id="Vector_82" d="M43.3833 8.47961C43.4951 8.47961 43.5868 8.39025 43.5868 8.27902C43.5868 8.16778 43.497 8.0766 43.3851 8.0766C43.2733 8.0766 43.1816 8.16595 43.1816 8.27719C43.1816 8.38843 43.2715 8.47961 43.3833 8.47961Z" fill="#91D7EC" />
                <path id="Vector_83" d="M44.7124 8.4887C44.8242 8.4887 44.9159 8.39935 44.9159 8.28811C44.9159 8.17687 44.8261 8.08569 44.7142 8.08569C44.6024 8.08569 44.5107 8.17505 44.5107 8.28629C44.5107 8.39752 44.6006 8.4887 44.7124 8.4887Z" fill="#91D7EC" />
                <path id="Vector_84" d="M35.6509 3.51946C35.6381 3.53405 35.6216 3.54135 35.6069 3.55229C35.6179 3.5687 35.6271 3.58511 35.6418 3.59788C35.7059 3.65258 35.7939 3.6617 35.8636 3.62705C35.8581 3.62341 35.8526 3.62341 35.8489 3.61794C35.7646 3.54499 35.7536 3.41734 35.8269 3.33346C35.8453 3.31158 35.8673 3.29516 35.8911 3.28422C35.8233 3.23499 35.7353 3.23499 35.6674 3.27875C35.7151 3.35352 35.7114 3.45017 35.6491 3.51946H35.6509Z" fill="#91D7EC" />
                <path id="Vector_85" d="M36.6408 4.40026C36.6316 4.4112 36.6188 4.4185 36.606 4.42579C36.617 4.4422 36.6261 4.45862 36.6426 4.47138C36.6738 4.49691 36.7123 4.50968 36.7508 4.51332C36.7948 4.51879 36.8369 4.5115 36.8754 4.48779C36.8718 4.48415 36.8663 4.48415 36.8608 4.4805C36.7746 4.40938 36.76 4.28355 36.8314 4.19602C36.8461 4.17779 36.8663 4.1632 36.8864 4.15043C36.8149 4.1012 36.7233 4.10484 36.6536 4.1559C36.7013 4.22885 36.7013 4.32732 36.6408 4.39661V4.40026Z" fill="#91D7EC" />
                <path id="Vector_86" d="M37.6455 5.26101C37.6455 5.26101 37.6309 5.27195 37.6235 5.27924C37.6364 5.29748 37.6492 5.31389 37.6675 5.32848C37.695 5.34854 37.7244 5.35948 37.7555 5.36495C37.8087 5.37407 37.8637 5.3613 37.9095 5.32848C37.9059 5.32666 37.9022 5.32666 37.9004 5.32483C37.8105 5.25918 37.7904 5.13336 37.8564 5.044C37.8692 5.02759 37.8839 5.01483 37.9004 5.00388C37.8215 4.95282 37.7225 4.96377 37.6547 5.02759C37.7024 5.09871 37.7042 5.19354 37.6474 5.26465L37.6455 5.26101Z" fill="#91D7EC" />
                <path id="Vector_87" d="M38.6885 6.07978C38.6885 6.07978 38.683 6.08343 38.6812 6.08525C38.6958 6.10531 38.7123 6.12354 38.7343 6.13813C38.7526 6.14907 38.7728 6.15637 38.793 6.16184C38.8626 6.18008 38.9341 6.16184 38.9855 6.10896C38.892 6.0506 38.8608 5.92842 38.9195 5.8336C38.9286 5.81901 38.9396 5.80989 38.9525 5.79895C38.8626 5.74424 38.749 5.76795 38.6867 5.85001C38.7343 5.91748 38.7398 6.00866 38.6885 6.0816V6.07978Z" fill="#91D7EC" />
                <path id="Vector_88" d="M39.794 6.79824C39.8123 6.82559 39.8361 6.85112 39.8691 6.86753C39.8746 6.86936 39.8783 6.86936 39.8838 6.87118C39.9736 6.90765 40.0744 6.87483 40.1276 6.79459C40.0378 6.74353 39.9993 6.63412 40.0433 6.53929C40.0469 6.53017 40.0561 6.52288 40.0616 6.51559C40.0579 6.51376 40.0561 6.51011 40.0524 6.50829C39.9516 6.45905 39.8306 6.49917 39.7811 6.59765C39.7811 6.60129 39.7811 6.60312 39.7793 6.60676C39.8178 6.66329 39.8251 6.73441 39.7976 6.79824H39.794Z" fill="#91D7EC" />
                <path id="Vector_89" d="M41.0184 7.43467C41.0367 7.44926 41.0569 7.46203 41.0825 7.47114C41.187 7.50579 41.3007 7.44926 41.3373 7.34714C41.2585 7.30155 41.2145 7.21037 41.2402 7.11919C41.2402 7.11555 41.2438 7.11372 41.2457 7.11008C41.2347 7.10278 41.2237 7.09366 41.2109 7.09002C41.1045 7.05537 40.989 7.1119 40.9542 7.21767C40.934 7.2742 40.945 7.33438 40.9725 7.38179C40.9854 7.40185 41 7.42008 41.0184 7.43649V7.43467Z" fill="#91D7EC" />
                <path id="Vector_90" d="M42.3769 7.89785C42.4869 7.91427 42.5914 7.83768 42.6079 7.72826C42.6079 7.72097 42.6079 7.71367 42.6079 7.70638C42.5456 7.66808 42.5126 7.60061 42.5163 7.52767C42.4943 7.51308 42.4668 7.50396 42.4393 7.49849C42.3293 7.48208 42.2248 7.55867 42.2083 7.66808C42.1918 7.7775 42.2688 7.88144 42.3788 7.89785H42.3769Z" fill="#91D7EC" />
                <path id="Vector_91" d="M43.6893 8.09115C43.7993 8.10756 43.9038 8.03097 43.9203 7.92156C43.9368 7.81215 43.8598 7.7082 43.7498 7.69179C43.6398 7.67538 43.5353 7.75197 43.5188 7.86138C43.5023 7.9708 43.5793 8.07474 43.6893 8.09115Z" fill="#91D7EC" />
                <path id="Vector_92" d="M34.9854 2.80463C34.9652 2.7408 34.9744 2.66968 35.022 2.61497C35.0587 2.57121 35.1119 2.54933 35.165 2.54568C35.154 2.51103 35.1375 2.47638 35.1064 2.45085C35.022 2.37791 34.8937 2.38703 34.8204 2.47274C34.747 2.55844 34.7562 2.68427 34.8424 2.75721C34.8827 2.79186 34.9359 2.80827 34.9854 2.80463Z" fill="#91D7EC" />
                <path id="Vector_93" d="M35.8486 3.61976C35.8486 3.61976 35.8596 3.62523 35.8633 3.62888C35.9018 3.65623 35.9458 3.67082 35.9916 3.66718C35.9714 3.60335 35.9806 3.53223 36.0264 3.47752C36.0649 3.43376 36.1163 3.41005 36.1694 3.40823C36.1584 3.37358 36.1419 3.33893 36.1107 3.3134C36.0466 3.2587 35.9604 3.2514 35.8908 3.28605C35.8669 3.29699 35.8449 3.3134 35.8266 3.33529C35.7533 3.41917 35.7643 3.54682 35.8486 3.61976Z" fill="#91D7EC" />
                <path id="Vector_94" d="M36.8606 4.48233C36.8606 4.48233 36.8697 4.48598 36.8752 4.48962C36.9137 4.51698 36.9596 4.52974 37.0054 4.5261C36.9852 4.46409 36.9907 4.39297 37.0347 4.33827C37.0714 4.29268 37.1246 4.26897 37.1777 4.2635C37.1667 4.22885 37.1484 4.19421 37.1172 4.1705C37.0494 4.11579 36.9577 4.11397 36.8862 4.15409C36.8661 4.16503 36.8477 4.17962 36.8312 4.19968C36.7598 4.28538 36.7744 4.41303 36.8606 4.48415V4.48233Z" fill="#91D7EC" />
                <path id="Vector_95" d="M37.9003 5.323C37.9003 5.323 37.9058 5.32482 37.9094 5.32665C37.9516 5.354 37.9993 5.36494 38.0469 5.35765C38.0231 5.29747 38.0268 5.22635 38.0671 5.16982C38.1001 5.12241 38.1514 5.09505 38.2064 5.08776C38.1936 5.05311 38.1734 5.02029 38.1404 4.99658C38.0671 4.9437 37.9699 4.94917 37.9003 5.00023C37.8838 5.01117 37.8691 5.02393 37.8563 5.04035C37.7903 5.1297 37.8104 5.25553 37.9003 5.32118V5.323Z" fill="#91D7EC" />
                <path id="Vector_96" d="M38.9872 6.10898C39.0349 6.13815 39.0881 6.14363 39.1376 6.13268C39.1101 6.07433 39.1064 6.00686 39.1412 5.94668C39.1706 5.89562 39.2201 5.86462 39.2732 5.85185C39.2567 5.81721 39.2347 5.78621 39.1981 5.76432C39.1174 5.71509 39.0166 5.73332 38.9524 5.79715C38.9414 5.80809 38.9286 5.81721 38.9194 5.8318C38.8608 5.92662 38.8919 6.0488 38.9854 6.10715L38.9872 6.10898Z" fill="#91D7EC" />
                <path id="Vector_97" d="M40.1274 6.79461C40.1274 6.79461 40.1365 6.80373 40.142 6.80555C40.1933 6.82926 40.2483 6.82926 40.2978 6.81102C40.2648 6.75814 40.2538 6.69067 40.2813 6.62866C40.3033 6.57578 40.3473 6.53749 40.3968 6.51925C40.3767 6.48643 40.3492 6.45542 40.3107 6.43719C40.219 6.39525 40.1145 6.42989 40.0595 6.51196C40.054 6.52107 40.0467 6.52654 40.0412 6.53566C39.9972 6.63049 40.0357 6.7399 40.1255 6.79096L40.1274 6.79461Z" fill="#91D7EC" />
                <path id="Vector_98" d="M41.3376 7.34717C41.3522 7.35446 41.3632 7.36358 41.3797 7.36905C41.4347 7.38364 41.4897 7.37635 41.5356 7.35082C41.4897 7.29429 41.4732 7.2177 41.5044 7.14658C41.5227 7.10463 41.5557 7.07363 41.5924 7.05175C41.5667 7.02075 41.5337 6.9934 41.4916 6.98063C41.3871 6.95145 41.2807 7.00799 41.2459 7.10828C41.2459 7.11193 41.2422 7.11375 41.2404 7.1174C41.2147 7.20858 41.2569 7.29976 41.3376 7.34535V7.34717Z" fill="#91D7EC" />
                <path id="Vector_99" d="M42.606 7.70455C42.6225 7.71367 42.6371 7.72461 42.6555 7.73008C42.7636 7.76109 42.8755 7.69908 42.9066 7.59149C42.9378 7.4839 42.8754 7.37266 42.7673 7.34166C42.6591 7.31066 42.5473 7.37267 42.5161 7.48026C42.5125 7.49484 42.5125 7.50943 42.5125 7.52585C42.5088 7.59879 42.5436 7.66626 42.6041 7.70455H42.606Z" fill="#91D7EC" />
                <path id="Vector_100" d="M34.151 2.09708C34.1584 2.06791 34.1712 2.04055 34.1914 2.01685C34.2335 1.96943 34.2922 1.94755 34.3508 1.94937C34.3692 1.87643 34.349 1.79619 34.2867 1.74331C34.2005 1.67219 34.0722 1.68313 34.0007 1.76884C33.9292 1.85455 33.9402 1.9822 34.0264 2.05332C34.063 2.08432 34.107 2.09526 34.151 2.09708Z" fill="#91D7EC" />
                <path id="Vector_101" d="M35.0218 2.61503C34.9742 2.66974 34.965 2.74086 34.9852 2.80468C34.9961 2.83933 35.0127 2.87398 35.0438 2.89951C35.0786 2.92868 35.1208 2.94145 35.163 2.94509C35.1703 2.91956 35.185 2.89586 35.2033 2.87398C35.2473 2.82474 35.3078 2.80468 35.3701 2.80833C35.394 2.73356 35.3738 2.64785 35.3096 2.59497C35.2693 2.56032 35.2161 2.54391 35.1666 2.54756C35.1135 2.5512 35.0621 2.57309 35.0236 2.61685L35.0218 2.61503Z" fill="#91D7EC" />
                <path id="Vector_102" d="M36.0264 3.47752C35.9806 3.53223 35.9714 3.60335 35.9916 3.66717C36.0026 3.70182 36.0191 3.73647 36.0502 3.762C36.0851 3.79117 36.1254 3.80212 36.1676 3.80576C36.1749 3.78388 36.1859 3.762 36.2024 3.74376C36.2464 3.6927 36.3087 3.67264 36.371 3.67629C36.3985 3.5997 36.3802 3.51034 36.3124 3.45381C36.272 3.41917 36.2207 3.40458 36.1712 3.4064C36.1181 3.41005 36.0649 3.43193 36.0282 3.4757L36.0264 3.47752Z" fill="#91D7EC" />
                <path id="Vector_103" d="M37.035 4.33825C36.991 4.39296 36.9837 4.46407 37.0057 4.52608C37.0185 4.56255 37.0368 4.59537 37.068 4.6209C37.101 4.64643 37.1413 4.65737 37.1798 4.66102C37.1872 4.64278 37.1945 4.62272 37.2073 4.60631C37.2513 4.55161 37.3155 4.52972 37.3815 4.53337C37.4108 4.45313 37.3906 4.36195 37.321 4.30542C37.2788 4.2726 37.2293 4.25983 37.1798 4.26348C37.1248 4.26713 37.0735 4.29266 37.0368 4.33825H37.035Z" fill="#91D7EC" />
                <path id="Vector_104" d="M38.0653 5.17165C38.0249 5.22819 38.0213 5.2993 38.0451 5.35948C38.0598 5.39595 38.0799 5.42878 38.1129 5.45248C38.1441 5.47437 38.1807 5.48348 38.2174 5.48531C38.2229 5.4689 38.2284 5.45248 38.2376 5.4379C38.2797 5.37772 38.3476 5.35036 38.4172 5.35584C38.4484 5.27195 38.4227 5.17713 38.3476 5.12242C38.3036 5.09142 38.2522 5.0823 38.2046 5.08959C38.1514 5.09689 38.1001 5.12424 38.0653 5.17165Z" fill="#91D7EC" />
                <path id="Vector_105" d="M39.1414 5.94666C39.1066 6.00684 39.1103 6.07431 39.1378 6.13267C39.1543 6.16732 39.1781 6.20014 39.2166 6.22202C39.2459 6.23844 39.2771 6.24573 39.3082 6.24573C39.3119 6.23297 39.3137 6.21838 39.3211 6.20561C39.3596 6.13632 39.4347 6.10167 39.5081 6.10532C39.5356 6.01778 39.5026 5.92113 39.4201 5.8719C39.3742 5.84637 39.3229 5.8409 39.2752 5.85184C39.2221 5.8646 39.1726 5.8956 39.1433 5.94666H39.1414Z" fill="#91D7EC" />
                <path id="Vector_106" d="M40.2814 6.6305C40.2557 6.6925 40.2649 6.75815 40.2979 6.81286C40.3199 6.84751 40.3474 6.87851 40.3896 6.89492C40.4134 6.90404 40.4372 6.90768 40.461 6.90951C40.4647 6.89127 40.4684 6.87121 40.4794 6.85298C40.5179 6.7855 40.5894 6.75086 40.6627 6.75268C40.6829 6.65968 40.6389 6.56121 40.5472 6.52291C40.4977 6.50285 40.4445 6.50285 40.3987 6.52109C40.3474 6.53932 40.3052 6.57762 40.2832 6.6305H40.2814Z" fill="#91D7EC" />
                <path id="Vector_107" d="M41.5023 7.14475C41.4712 7.21587 41.4877 7.29428 41.5335 7.34899C41.5537 7.37452 41.5775 7.39458 41.6086 7.40916C41.7113 7.45293 41.8305 7.40552 41.8745 7.30157C41.9185 7.19763 41.8708 7.08092 41.7663 7.03716C41.7058 7.01163 41.6416 7.02074 41.5885 7.04992C41.55 7.0718 41.5188 7.10098 41.5005 7.14475H41.5023Z" fill="#91D7EC" />
                <path id="Vector_108" d="M33.3555 1.51357C33.3793 1.49351 33.4068 1.47892 33.4362 1.47163C33.4472 1.46251 33.4582 1.45704 33.4673 1.4461C33.537 1.35857 33.5223 1.23274 33.4362 1.16345C33.3482 1.09415 33.2217 1.10874 33.152 1.19445C33.0824 1.28198 33.097 1.4078 33.1832 1.4771C33.2345 1.51722 33.2987 1.52634 33.3573 1.51175L33.3555 1.51357Z" fill="#91D7EC" />
                <path id="Vector_109" d="M34.1916 2.01687C34.1715 2.04058 34.1586 2.06793 34.1513 2.09711C34.133 2.17005 34.1513 2.25029 34.2136 2.30135C34.2686 2.34694 34.3383 2.35606 34.4024 2.33782C34.4171 2.3287 34.4318 2.32506 34.4483 2.31959C34.4666 2.30865 34.4849 2.29588 34.4996 2.27947C34.5729 2.19558 34.5619 2.06793 34.4776 1.99499C34.4409 1.96399 34.3969 1.95123 34.3511 1.9494C34.2925 1.9494 34.232 1.96946 34.1916 2.01687Z" fill="#91D7EC" />
                <path id="Vector_110" d="M35.2014 2.8721C35.1831 2.89398 35.1703 2.91769 35.1611 2.94322C35.1373 3.01798 35.1574 3.10187 35.2197 3.15657C35.3041 3.22952 35.4324 3.2204 35.5057 3.13651C35.5791 3.05263 35.5699 2.92498 35.4856 2.85204C35.4507 2.82104 35.4086 2.80827 35.3664 2.80645C35.3059 2.8028 35.2436 2.82286 35.1996 2.8721H35.2014Z" fill="#91D7EC" />
                <path id="Vector_111" d="M36.2024 3.74197C36.1859 3.76021 36.1749 3.78209 36.1676 3.80397C36.1401 3.88056 36.1584 3.96992 36.2244 4.02645C36.3088 4.09939 36.4371 4.08845 36.5104 4.00456C36.5837 3.92068 36.5727 3.79303 36.4884 3.72009C36.4536 3.69091 36.4133 3.67814 36.3711 3.67632C36.3088 3.67267 36.2464 3.69273 36.2024 3.74379V3.74197Z" fill="#91D7EC" />
                <path id="Vector_112" d="M37.207 4.60453C37.1942 4.62095 37.1869 4.641 37.1795 4.65924C37.1502 4.73948 37.1704 4.83066 37.24 4.88719C37.328 4.95648 37.4545 4.94189 37.5242 4.85436C37.5939 4.76683 37.5792 4.641 37.4912 4.57171C37.4582 4.54618 37.4197 4.53524 37.3794 4.53159C37.3152 4.52612 37.2492 4.54983 37.2052 4.60453H37.207Z" fill="#91D7EC" />
                <path id="Vector_113" d="M38.2392 5.43786C38.2282 5.45245 38.2245 5.46886 38.219 5.48528C38.1878 5.56916 38.2135 5.66581 38.2905 5.71869C38.3821 5.78252 38.5086 5.75881 38.5728 5.66763C38.637 5.57645 38.6131 5.45063 38.5215 5.3868C38.4903 5.36492 38.4536 5.35763 38.4188 5.35398C38.351 5.35033 38.2813 5.37586 38.2392 5.43604V5.43786Z" fill="#91D7EC" />
                <path id="Vector_114" d="M39.3192 6.20744C39.3119 6.2202 39.31 6.23479 39.3064 6.24756C39.2789 6.33691 39.3119 6.43538 39.3962 6.4828C39.4933 6.5375 39.618 6.50286 39.6712 6.40621C39.7262 6.30956 39.6913 6.18555 39.5942 6.13267C39.5667 6.11626 39.5355 6.11079 39.5062 6.10896C39.431 6.10532 39.3577 6.13997 39.3192 6.20926V6.20744Z" fill="#91D7EC" />
                <path id="Vector_115" d="M40.4777 6.853C40.4685 6.87123 40.463 6.88947 40.4594 6.90953C40.441 6.99341 40.4759 7.08277 40.5547 7.12836C40.6519 7.18306 40.7765 7.14841 40.8297 7.05177C40.8847 6.95512 40.8499 6.83111 40.7527 6.77823C40.7234 6.76182 40.6922 6.75635 40.6592 6.75452C40.5859 6.7527 40.5144 6.78735 40.4759 6.85482L40.4777 6.853Z" fill="#91D7EC" />
                <path id="Vector_116" d="M32.5874 0.988348C32.6552 0.898993 32.6369 0.773166 32.5489 0.705694C32.4591 0.638222 32.3326 0.656458 32.2647 0.743989C32.1969 0.833344 32.2153 0.959171 32.3032 1.02664C32.3931 1.09411 32.5196 1.07588 32.5874 0.988348Z" fill="#91D7EC" />
                <path id="Vector_117" d="M33.3278 1.53542C33.2564 1.62112 33.2674 1.74877 33.3535 1.81989C33.4397 1.89101 33.568 1.88007 33.6395 1.79436C33.711 1.70866 33.7 1.58101 33.6138 1.50989C33.5625 1.46794 33.4965 1.457 33.436 1.47342C33.4067 1.48071 33.3792 1.4953 33.3553 1.51536C33.3462 1.52265 33.3352 1.52812 33.3278 1.53724V1.53542Z" fill="#91D7EC" />
                <path id="Vector_118" d="M34.3511 2.37609C34.2778 2.45997 34.2851 2.58762 34.3695 2.66056C34.4538 2.7335 34.5821 2.72621 34.6554 2.64233C34.7288 2.55844 34.7214 2.43079 34.6371 2.35785C34.5839 2.31044 34.5125 2.2995 34.4465 2.31955C34.43 2.3232 34.4153 2.32867 34.4006 2.33779C34.3823 2.34873 34.364 2.35967 34.3493 2.37609H34.3511Z" fill="#91D7EC" />
                <path id="Vector_119" d="M35.3485 3.24961C35.2733 3.33167 35.2806 3.45932 35.3631 3.53409C35.4328 3.59609 35.53 3.59791 35.6051 3.5505C35.6198 3.54138 35.6363 3.53226 35.6491 3.51768C35.7114 3.44838 35.7133 3.35173 35.6674 3.27696C35.6583 3.26238 35.6491 3.24596 35.6344 3.2332C35.552 3.15843 35.4236 3.16573 35.3485 3.24779V3.24961Z" fill="#91D7EC" />
                <path id="Vector_120" d="M36.3347 4.13588C36.2614 4.21976 36.2705 4.34741 36.3549 4.42035C36.3585 4.424 36.3622 4.424 36.3659 4.42582C36.4392 4.48053 36.5364 4.47871 36.6079 4.42582C36.6189 4.41671 36.6317 4.41124 36.6427 4.40029C36.7032 4.331 36.705 4.23253 36.6555 4.15958C36.6464 4.14499 36.6372 4.12858 36.6225 4.11582C36.5382 4.04287 36.4099 4.05199 36.3365 4.13588H36.3347Z" fill="#91D7EC" />
                <path id="Vector_121" d="M37.3298 5.00935C37.2602 5.09688 37.273 5.22271 37.361 5.29201C37.361 5.29201 37.361 5.29201 37.3628 5.29201C37.4417 5.35401 37.5517 5.34489 37.625 5.27924C37.6323 5.27195 37.6415 5.2683 37.647 5.261C37.7038 5.18989 37.7038 5.09506 37.6543 5.02394C37.6433 5.00753 37.6323 4.99112 37.6158 4.97835C37.5278 4.90906 37.4013 4.92182 37.3317 5.00935H37.3298Z" fill="#91D7EC" />
                <path id="Vector_122" d="M38.3565 5.84816C38.296 5.93569 38.3143 6.0524 38.3968 6.11805C38.4005 6.1217 38.4023 6.12534 38.406 6.12717C38.4958 6.18917 38.6168 6.16911 38.681 6.0834C38.6828 6.08158 38.6865 6.07976 38.6883 6.07793C38.7378 6.00681 38.7341 5.91381 38.6865 5.84634C38.6736 5.8281 38.659 5.80987 38.6388 5.7971C38.5472 5.73328 38.4207 5.75516 38.3565 5.84634V5.84816Z" fill="#91D7EC" />
                <path id="Vector_123" d="M39.4454 6.60494C39.3849 6.69248 39.4032 6.80918 39.4857 6.87483C39.4894 6.87848 39.4912 6.88213 39.4967 6.88577C39.5884 6.9496 39.7149 6.92772 39.779 6.83654C39.7882 6.8256 39.79 6.81101 39.7955 6.79824C39.823 6.73442 39.8175 6.6633 39.7772 6.60677C39.7643 6.58853 39.7478 6.5703 39.7277 6.55571C39.636 6.49188 39.5095 6.51377 39.4454 6.60494Z" fill="#91D7EC" />
                <path id="Vector_124" d="M31.6654 0.645559C31.7296 0.55438 31.7076 0.428554 31.6159 0.364729C31.5243 0.300904 31.3978 0.322787 31.3336 0.413965C31.2694 0.505144 31.2914 0.63097 31.3831 0.694795C31.4748 0.75862 31.6013 0.736737 31.6654 0.645559Z" fill="#91D7EC" />
                <path id="Vector_125" d="M32.426 1.16524C32.3564 1.25277 32.3692 1.37859 32.4572 1.44789C32.5452 1.51718 32.6717 1.50442 32.7414 1.41689C32.811 1.32936 32.7982 1.20353 32.7102 1.13424C32.6222 1.06494 32.4957 1.0777 32.426 1.16524Z" fill="#91D7EC" />
                <path id="Vector_126" d="M33.4693 1.98586C33.396 2.06974 33.4033 2.19739 33.4876 2.27034C33.572 2.34328 33.7003 2.33598 33.7736 2.2521C33.8469 2.16822 33.8396 2.04057 33.7553 1.96762C33.6709 1.89468 33.5426 1.90197 33.4693 1.98586Z" fill="#91D7EC" />
                <path id="Vector_127" d="M34.4685 2.85571C34.3915 2.93777 34.397 3.06542 34.4795 3.14019C34.562 3.21678 34.6904 3.21131 34.7655 3.12925C34.8425 3.04719 34.837 2.91954 34.7545 2.84477C34.672 2.76818 34.5437 2.77365 34.4685 2.85571Z" fill="#91D7EC" />
                <path id="Vector_128" d="M35.7367 4.03006C35.8137 3.948 35.81 3.82217 35.7275 3.74558C35.645 3.66899 35.5185 3.67264 35.4416 3.7547C35.3646 3.83676 35.3682 3.96259 35.4507 4.03918C35.5332 4.11577 35.6597 4.11212 35.7367 4.03006Z" fill="#91D7EC" />
                <path id="Vector_129" d="M36.4701 4.61548C36.4463 4.62642 36.4243 4.64101 36.4059 4.66107C36.3308 4.74313 36.3363 4.87078 36.4188 4.94554C36.5013 5.02031 36.6296 5.01484 36.7047 4.93278C36.7799 4.85072 36.7744 4.72307 36.6919 4.6483C36.6791 4.63736 36.6644 4.63007 36.6498 4.62277C36.5929 4.59359 36.5269 4.58812 36.4701 4.61548Z" fill="#91D7EC" />
                <path id="Vector_130" d="M37.4839 5.4926C37.4454 5.50354 37.4105 5.52177 37.383 5.55278C37.3225 5.62389 37.3244 5.72237 37.3757 5.79531C37.3867 5.8099 37.3959 5.82449 37.4087 5.83725C37.4949 5.90837 37.6232 5.89743 37.6947 5.81172C37.7662 5.72601 37.7552 5.59836 37.669 5.52725C37.6525 5.51448 37.6342 5.50719 37.6158 5.49807C37.5737 5.47983 37.5279 5.47801 37.4839 5.49077V5.4926Z" fill="#91D7EC" />
                <path id="Vector_131" d="M38.538 6.32964C38.538 6.32964 38.5251 6.33328 38.5178 6.33511C38.4738 6.34423 38.4335 6.36428 38.4023 6.40076C38.34 6.47552 38.3437 6.57947 38.4023 6.65241C38.4115 6.66335 38.417 6.67612 38.428 6.68523C38.5141 6.75635 38.6425 6.74541 38.714 6.6597C38.7855 6.574 38.7745 6.44635 38.6883 6.37523C38.6663 6.35699 38.6406 6.34423 38.615 6.33693C38.5893 6.32964 38.5636 6.32781 38.538 6.32964Z" fill="#91D7EC" />
                <path id="Vector_132" d="M30.4169 0.477793C30.5104 0.537971 30.6369 0.510617 30.6973 0.417615C30.7578 0.324613 30.7303 0.198787 30.6369 0.138609C30.5434 0.0784314 30.4169 0.105785 30.3564 0.198787C30.2959 0.291789 30.3234 0.417615 30.4169 0.477793Z" fill="#91D7EC" />
                <path id="Vector_133" d="M31.4801 0.902677C31.4123 0.992031 31.4288 1.11786 31.5186 1.18533C31.6085 1.2528 31.735 1.23639 31.8028 1.14703C31.8706 1.05768 31.8541 0.931854 31.7643 0.864382C31.6745 0.796909 31.548 0.813322 31.4801 0.902677Z" fill="#91D7EC" />
                <path id="Vector_134" d="M32.5452 1.6941C32.4718 1.77799 32.481 1.90564 32.5653 1.97858C32.6496 2.05152 32.778 2.04241 32.8513 1.95852C32.9246 1.87464 32.9155 1.74699 32.8311 1.67404C32.7468 1.6011 32.6185 1.61022 32.5452 1.6941Z" fill="#91D7EC" />
                <path id="Vector_135" d="M33.5536 2.55301C33.4766 2.63324 33.4802 2.76089 33.5609 2.83748C33.6416 2.91407 33.7699 2.91043 33.8469 2.83019C33.9239 2.74995 33.9202 2.6223 33.8396 2.54571C33.7589 2.46912 33.6306 2.47277 33.5536 2.55301Z" fill="#91D7EC" />
                <path id="Vector_136" d="M34.8095 3.45749C34.7306 3.37908 34.6023 3.37908 34.5235 3.45749C34.4446 3.53591 34.4446 3.66356 34.5235 3.74197C34.6023 3.82038 34.7306 3.82038 34.8095 3.74197C34.8883 3.66356 34.8883 3.53591 34.8095 3.45749Z" fill="#91D7EC" />
                <path id="Vector_137" d="M35.7514 4.38748C35.6725 4.30907 35.5442 4.30907 35.4654 4.38748C35.3865 4.4659 35.3865 4.59355 35.4654 4.67196C35.5442 4.75038 35.6725 4.75038 35.7514 4.67196C35.8302 4.59355 35.8302 4.4659 35.7514 4.38748Z" fill="#91D7EC" />
                <path id="Vector_138" d="M36.6864 5.32115C36.6057 5.24456 36.4774 5.24639 36.4004 5.3248C36.3234 5.40504 36.3252 5.53269 36.404 5.60928C36.4847 5.68587 36.613 5.68404 36.69 5.60563C36.767 5.52539 36.7652 5.39774 36.6864 5.32115Z" fill="#91D7EC" />
                <path id="Vector_139" d="M37.354 6.24393C37.277 6.32417 37.2788 6.45181 37.3576 6.5284C37.4383 6.60499 37.5666 6.60317 37.6436 6.52476C37.7206 6.44452 37.7188 6.31687 37.64 6.24028C37.5593 6.16369 37.431 6.16551 37.354 6.24393Z" fill="#91D7EC" />
                <path id="Vector_140" d="M29.3995 0.375627C29.4967 0.432158 29.6195 0.399334 29.6763 0.302684C29.7332 0.206035 29.7002 0.0838561 29.603 0.0273254C29.5058 -0.0292052 29.383 0.00361902 29.3262 0.100268C29.2693 0.196917 29.3023 0.319097 29.3995 0.375627Z" fill="#91D7EC" />
                <path id="Vector_141" d="M30.4866 0.745825C30.4224 0.837003 30.4426 0.96283 30.5342 1.02665C30.6259 1.09048 30.7524 1.07042 30.8166 0.979242C30.8807 0.888063 30.8605 0.762237 30.7689 0.698412C30.6772 0.634587 30.5507 0.654646 30.4866 0.745825Z" fill="#91D7EC" />
                <path id="Vector_142" d="M31.5754 1.50077C31.5039 1.58648 31.5149 1.71413 31.6011 1.78525C31.6872 1.85637 31.8156 1.84543 31.8871 1.75972C31.9586 1.67401 31.9476 1.54636 31.8614 1.47524C31.7752 1.40413 31.6469 1.41507 31.5754 1.50077Z" fill="#91D7EC" />
                <path id="Vector_143" d="M32.8879 2.33233C32.8072 2.25574 32.6789 2.25939 32.6019 2.33963C32.5249 2.41987 32.5286 2.54752 32.6092 2.62411C32.6899 2.7007 32.8182 2.69705 32.8952 2.61681C32.9722 2.53657 32.9686 2.40892 32.8879 2.33233Z" fill="#91D7EC" />
                <path id="Vector_144" d="M33.8599 3.24597C33.781 3.16573 33.6527 3.16391 33.5739 3.24232C33.4932 3.32073 33.4914 3.44838 33.5702 3.5268C33.649 3.60703 33.7774 3.60886 33.8562 3.53044C33.9368 3.45203 33.9387 3.32438 33.8599 3.24597Z" fill="#91D7EC" />
                <path id="Vector_145" d="M34.7875 4.19788C34.7123 4.11581 34.584 4.11034 34.5015 4.18693C34.419 4.26352 34.4135 4.38935 34.4905 4.47141C34.5657 4.55347 34.694 4.55894 34.7765 4.48235C34.859 4.40576 34.8645 4.27994 34.7875 4.19788Z" fill="#91D7EC" />
                <path id="Vector_146" d="M35.6891 5.16982C35.614 5.08776 35.4856 5.08229 35.4031 5.15706C35.3206 5.23182 35.3151 5.35947 35.3903 5.44153C35.4655 5.52359 35.5938 5.52907 35.6763 5.4543C35.7588 5.37953 35.7643 5.25188 35.6891 5.16982Z" fill="#91D7EC" />
                <path id="Vector_147" d="M36.2996 6.13081C36.2171 6.20558 36.2116 6.33323 36.2868 6.41529C36.362 6.49735 36.4903 6.50282 36.5728 6.42805C36.6553 6.35329 36.6608 6.22564 36.5856 6.14358C36.5104 6.06152 36.3821 6.05605 36.2996 6.13081Z" fill="#91D7EC" />
                <path id="Vector_148" d="M28.3323 0.388434C28.4313 0.439494 28.5542 0.399376 28.6055 0.299079C28.6568 0.198783 28.6165 0.0784274 28.5157 0.0273675C28.4167 -0.0236925 28.2938 0.0164261 28.2425 0.116722C28.1912 0.215195 28.2315 0.337374 28.3323 0.388434Z" fill="#91D7EC" />
                <path id="Vector_149" d="M29.4399 0.694762C29.3794 0.787764 29.4051 0.913591 29.4986 0.973768C29.5921 1.03395 29.7186 1.00842 29.7791 0.915414C29.8396 0.822412 29.8139 0.696586 29.7204 0.636408C29.6269 0.57623 29.5004 0.60176 29.4399 0.694762Z" fill="#91D7EC" />
                <path id="Vector_150" d="M30.5615 1.40231C30.4919 1.48984 30.5065 1.61566 30.5945 1.68496C30.6825 1.75425 30.809 1.73967 30.8787 1.65214C30.9484 1.5646 30.9337 1.43878 30.8457 1.36948C30.7577 1.30019 30.6312 1.31477 30.5615 1.40231Z" fill="#91D7EC" />
                <path id="Vector_151" d="M31.8961 2.2047C31.8136 2.12811 31.6853 2.13358 31.6101 2.21564C31.5331 2.2977 31.5386 2.42535 31.6211 2.50011C31.7036 2.57488 31.832 2.57123 31.9071 2.48917C31.9841 2.40711 31.9786 2.27946 31.8961 2.2047Z" fill="#91D7EC" />
                <path id="Vector_152" d="M32.8752 3.11282C32.7982 3.03258 32.6699 3.02894 32.5892 3.10553C32.5086 3.18212 32.5049 3.30977 32.5819 3.39C32.6589 3.47024 32.7872 3.47389 32.8679 3.3973C32.9485 3.32071 32.9522 3.19306 32.8752 3.11282Z" fill="#91D7EC" />
                <path id="Vector_153" d="M33.7976 4.07386C33.7243 3.98998 33.5959 3.98086 33.5116 4.05381C33.4273 4.12675 33.4181 4.2544 33.4914 4.33828C33.5648 4.42217 33.6931 4.43128 33.7774 4.35834C33.8618 4.2854 33.8709 4.15775 33.7976 4.07386Z" fill="#91D7EC" />
                <path id="Vector_154" d="M34.6499 5.35765C34.7361 5.28653 34.7471 5.15888 34.6774 5.07318C34.6078 4.98747 34.4776 4.97653 34.3914 5.04582C34.3053 5.11694 34.2943 5.24459 34.3639 5.3303C34.4354 5.41601 34.5638 5.42695 34.6499 5.35765Z" fill="#91D7EC" />
                <path id="Vector_155" d="M35.2381 6.06334C35.152 6.13446 35.141 6.26211 35.2106 6.34782C35.2821 6.43353 35.4104 6.44447 35.4966 6.37517C35.5828 6.30405 35.5938 6.1764 35.5241 6.09069C35.4526 6.00499 35.3243 5.99404 35.2381 6.06334Z" fill="#91D7EC" />
                <path id="Vector_156" d="M27.216 0.516062C27.3186 0.559828 27.4378 0.512415 27.4818 0.410295C27.5258 0.308175 27.4781 0.189643 27.3755 0.145878C27.2728 0.102112 27.1536 0.149525 27.1096 0.251645C27.0657 0.353765 27.1133 0.472297 27.216 0.516062Z" fill="#91D7EC" />
                <path id="Vector_157" d="M28.3419 0.747674C28.285 0.844323 28.318 0.966503 28.4134 1.02303C28.5087 1.07956 28.6334 1.04674 28.6902 0.95009C28.747 0.853441 28.714 0.731262 28.6169 0.674731C28.5197 0.618201 28.3969 0.651025 28.34 0.745851L28.3419 0.747674Z" fill="#91D7EC" />
                <path id="Vector_158" d="M29.4985 1.39506C29.4325 1.48441 29.4509 1.61024 29.5407 1.67771C29.6305 1.74518 29.757 1.72512 29.8248 1.63577C29.8908 1.54641 29.8725 1.42059 29.7827 1.35312C29.6928 1.28747 29.5664 1.3057 29.4985 1.39506Z" fill="#91D7EC" />
                <path id="Vector_159" d="M30.5765 2.17003C30.5013 2.25209 30.5087 2.37974 30.5912 2.4545C30.6737 2.52927 30.802 2.52198 30.8771 2.43992C30.9523 2.35786 30.945 2.23021 30.8625 2.15544C30.78 2.08067 30.6517 2.08797 30.5765 2.17003Z" fill="#91D7EC" />
                <path id="Vector_160" d="M31.8596 3.04898C31.7826 2.96874 31.6543 2.96509 31.5736 3.04168C31.4929 3.11827 31.4893 3.24592 31.5663 3.32616C31.6433 3.4064 31.7716 3.41005 31.8523 3.33346C31.9329 3.25687 31.9366 3.12922 31.8596 3.04898Z" fill="#91D7EC" />
                <path id="Vector_161" d="M32.7852 4.01371C32.7137 3.928 32.5854 3.91706 32.4992 3.99C32.413 4.06294 32.402 4.18877 32.4754 4.27448C32.5469 4.36018 32.6752 4.37113 32.7613 4.29818C32.8475 4.22706 32.8585 4.09941 32.7852 4.01371Z" fill="#91D7EC" />
                <path id="Vector_162" d="M33.3626 4.99476C33.2746 5.06223 33.2581 5.18988 33.326 5.27741C33.3938 5.36495 33.5221 5.38136 33.6101 5.31388C33.6981 5.24641 33.7146 5.11876 33.6468 5.03123C33.579 4.9437 33.4506 4.92729 33.3626 4.99476Z" fill="#91D7EC" />
                <path id="Vector_163" d="M34.1732 6.03968C34.0852 6.10715 34.0687 6.2348 34.1365 6.32234C34.2044 6.40987 34.3327 6.42628 34.4207 6.35881C34.5087 6.29133 34.5252 6.16368 34.4573 6.07615C34.3895 5.98862 34.2612 5.97221 34.1732 6.03968Z" fill="#91D7EC" />
                <path id="Vector_164" d="M26.0556 0.756771C26.1619 0.793242 26.2774 0.736712 26.3123 0.630945C26.3489 0.525178 26.2921 0.410293 26.1858 0.375645C26.0794 0.339174 25.9639 0.395704 25.9291 0.501471C25.8924 0.607238 25.9493 0.722123 26.0556 0.756771Z" fill="#91D7EC" />
                <path id="Vector_165" d="M27.1957 0.904497C27.1444 1.00297 27.1847 1.12515 27.2837 1.17621C27.3827 1.22727 27.5055 1.18715 27.5568 1.08868C27.6082 0.990204 27.5678 0.868025 27.4688 0.816965C27.3698 0.765905 27.247 0.806024 27.1957 0.904497Z" fill="#91D7EC" />
                <path id="Vector_166" d="M28.6735 1.4297C28.5818 1.3677 28.4553 1.3914 28.3912 1.48258C28.3289 1.57376 28.3527 1.69959 28.4443 1.76341C28.536 1.82541 28.6625 1.80171 28.7267 1.71053C28.789 1.61935 28.7652 1.49352 28.6735 1.4297Z" fill="#91D7EC" />
                <path id="Vector_167" d="M29.7879 2.18645C29.7035 2.11351 29.5752 2.12445 29.5019 2.20833C29.4286 2.29222 29.4396 2.41987 29.5239 2.49281C29.6082 2.56575 29.7365 2.55481 29.8099 2.47093C29.8832 2.38704 29.8722 2.25939 29.7879 2.18645Z" fill="#91D7EC" />
                <path id="Vector_168" d="M30.811 3.0581C30.7322 2.97786 30.6039 2.97604 30.525 3.05445C30.4444 3.13287 30.4425 3.26052 30.5214 3.33893C30.6002 3.41917 30.7285 3.42099 30.8074 3.34258C30.888 3.26416 30.8899 3.13651 30.811 3.0581Z" fill="#91D7EC" />
                <path id="Vector_169" d="M31.4619 3.99179C31.3758 4.0629 31.3648 4.19055 31.4362 4.27626C31.5077 4.36197 31.6361 4.37291 31.7222 4.30179C31.8084 4.23067 31.8194 4.10302 31.7479 4.01732C31.6764 3.93161 31.5481 3.92067 31.4619 3.99179Z" fill="#91D7EC" />
                <path id="Vector_170" d="M32.3217 4.99658C32.2318 5.06222 32.2117 5.18805 32.2777 5.27923C32.3437 5.36858 32.4702 5.38864 32.5618 5.32299C32.6516 5.25735 32.6718 5.13152 32.6058 5.04034C32.5398 4.95099 32.4133 4.93093 32.3217 4.99658Z" fill="#91D7EC" />
                <path id="Vector_171" d="M33.3484 6.38797C33.4383 6.32232 33.4584 6.1965 33.3924 6.10532C33.3264 6.01414 33.1999 5.99591 33.1083 6.06155C33.0185 6.1272 32.9983 6.25303 33.0643 6.34421C33.1303 6.43356 33.2568 6.45362 33.3484 6.38797Z" fill="#91D7EC" />
                <path id="Vector_172" d="M24.8586 1.11421C24.9667 1.14156 25.0767 1.07773 25.1061 0.96832C25.1336 0.860729 25.0694 0.751315 24.9594 0.722138C24.8512 0.694785 24.7412 0.75861 24.7119 0.868024C24.6844 0.975614 24.7486 1.08503 24.8586 1.11421Z" fill="#91D7EC" />
                <path id="Vector_173" d="M26.01 1.16711C25.966 1.26923 26.0137 1.38776 26.1164 1.43153C26.219 1.47529 26.3382 1.42788 26.3822 1.32576C26.4262 1.22364 26.3785 1.10511 26.2759 1.06134C26.1732 1.01758 26.054 1.06499 26.01 1.16711Z" fill="#91D7EC" />
                <path id="Vector_174" d="M27.2436 1.66311C27.1849 1.75794 27.2161 1.88194 27.3114 1.94029C27.4067 1.99865 27.5314 1.96765 27.59 1.87282C27.6487 1.778 27.6175 1.65399 27.5222 1.59564C27.4269 1.53729 27.3022 1.56829 27.2436 1.66311Z" fill="#91D7EC" />
                <path id="Vector_175" d="M28.6753 2.2977C28.5873 2.22841 28.4608 2.243 28.3911 2.33053C28.3215 2.41806 28.3361 2.54389 28.4241 2.61318C28.5121 2.68248 28.6386 2.66789 28.7083 2.58036C28.7779 2.49283 28.7633 2.367 28.6753 2.2977Z" fill="#91D7EC" />
                <path id="Vector_176" d="M29.4473 3.13657C29.3685 3.21498 29.3685 3.34263 29.4473 3.42105C29.5261 3.49946 29.6545 3.49946 29.7333 3.42105C29.8121 3.34263 29.8121 3.21498 29.7333 3.13657C29.6545 3.05816 29.5261 3.05816 29.4473 3.13657Z" fill="#91D7EC" />
                <path id="Vector_177" d="M30.4023 4.05197C30.3162 4.12308 30.3052 4.25074 30.3767 4.33644C30.4482 4.42215 30.5765 4.43309 30.6627 4.36197C30.7488 4.29085 30.7598 4.1632 30.6883 4.0775C30.6168 3.99179 30.4885 3.98085 30.4023 4.05197Z" fill="#91D7EC" />
                <path id="Vector_178" d="M31.5057 5.38135C31.5973 5.3157 31.6175 5.18988 31.5515 5.10052C31.4855 5.00934 31.359 4.98928 31.2692 5.05493C31.1775 5.12058 31.1574 5.24641 31.2233 5.33576C31.2893 5.42694 31.4158 5.447 31.5057 5.38135Z" fill="#91D7EC" />
                <path id="Vector_179" d="M32.2796 6.45545C32.3713 6.3898 32.3914 6.26397 32.3254 6.17462C32.2594 6.08344 32.1329 6.06338 32.0431 6.12903C31.9514 6.19468 31.9313 6.3205 31.9973 6.40986C32.0633 6.50104 32.1898 6.5211 32.2796 6.45545Z" fill="#91D7EC" />
                <path id="Vector_180" d="M23.6433 1.57556C23.7533 1.5938 23.8578 1.52085 23.8761 1.40962C23.8944 1.3002 23.8211 1.19626 23.7093 1.17802C23.5993 1.15979 23.4948 1.23273 23.4764 1.34397C23.4581 1.45521 23.5314 1.55733 23.6433 1.57556Z" fill="#91D7EC" />
                <path id="Vector_181" d="M24.7924 1.53177C24.7557 1.63754 24.8126 1.75242 24.9171 1.78889C25.0234 1.82536 25.1389 1.76883 25.1756 1.66489C25.2122 1.55912 25.1554 1.44424 25.0509 1.40777C24.9446 1.37129 24.8291 1.42782 24.7924 1.53177Z" fill="#91D7EC" />
                <path id="Vector_182" d="M26.3342 1.85091C26.2352 1.79803 26.1124 1.83632 26.0611 1.93479C26.0079 2.03327 26.0464 2.15545 26.1454 2.20651C26.2444 2.25939 26.3672 2.22109 26.4185 2.12262C26.4717 2.02415 26.4332 1.90197 26.3342 1.85091Z" fill="#91D7EC" />
                <path id="Vector_183" d="M27.5315 2.48554C27.4417 2.41989 27.3134 2.43995 27.2492 2.53113C27.1832 2.62048 27.2034 2.74813 27.2951 2.81195C27.3849 2.8776 27.5132 2.85754 27.5774 2.76637C27.6434 2.67701 27.6232 2.54936 27.5315 2.48554Z" fill="#91D7EC" />
                <path id="Vector_184" d="M28.3398 3.28609C28.2628 3.36815 28.2683 3.4958 28.349 3.57057C28.4315 3.64716 28.5598 3.64169 28.635 3.56145C28.712 3.47939 28.7065 3.35174 28.6258 3.27697C28.5433 3.20038 28.415 3.20585 28.3398 3.28609Z" fill="#91D7EC" />
                <path id="Vector_185" d="M29.5899 4.4787C29.6743 4.40576 29.6834 4.27811 29.6101 4.19423C29.5368 4.11034 29.4084 4.10122 29.3241 4.17417C29.2398 4.24711 29.2306 4.37476 29.3039 4.45864C29.3773 4.54253 29.5056 4.55165 29.5899 4.4787Z" fill="#91D7EC" />
                <path id="Vector_186" d="M30.4442 5.49075C30.5358 5.42692 30.556 5.29927 30.4918 5.20992C30.4277 5.12056 30.2994 5.09868 30.2095 5.1625C30.1179 5.22633 30.0977 5.35398 30.1619 5.44333C30.226 5.53451 30.3544 5.55457 30.4442 5.49075Z" fill="#91D7EC" />
                <path id="Vector_187" d="M30.9319 6.51926C30.996 6.61044 31.1244 6.6305 31.2142 6.56667C31.304 6.50285 31.326 6.3752 31.2619 6.28584C31.1977 6.19649 31.0694 6.17461 30.9796 6.23843C30.8879 6.30226 30.8677 6.42991 30.9319 6.51926Z" fill="#91D7EC" />
                <path id="Vector_188" d="M22.4149 2.13906C22.5267 2.14818 22.6238 2.06612 22.633 1.95488C22.6422 1.84364 22.5597 1.74699 22.4479 1.73787C22.336 1.72876 22.2389 1.81082 22.2297 1.92206C22.2205 2.03329 22.303 2.12994 22.4149 2.13906Z" fill="#91D7EC" />
                <path id="Vector_189" d="M23.5606 1.99499C23.5331 2.10258 23.5972 2.212 23.7054 2.24117C23.8135 2.26853 23.9235 2.2047 23.9529 2.09711C23.9804 1.98952 23.9162 1.88011 23.808 1.85093C23.6999 1.82358 23.5899 1.8874 23.5606 1.99499Z" fill="#91D7EC" />
                <path id="Vector_190" d="M24.8566 2.29772C24.8108 2.39984 24.8566 2.51837 24.9593 2.56396C25.062 2.60955 25.1811 2.56396 25.227 2.46184C25.2728 2.35972 25.227 2.24119 25.1243 2.1956C25.0216 2.15001 24.9025 2.1956 24.8566 2.29772Z" fill="#91D7EC" />
                <path id="Vector_191" d="M26.3634 2.74997C26.2699 2.68979 26.1434 2.71532 26.0829 2.81014C26.0224 2.90497 26.0481 3.02897 26.1434 3.08915C26.2369 3.14933 26.3634 3.1238 26.4239 3.02897C26.4844 2.93415 26.4587 2.81014 26.3634 2.74997Z" fill="#91D7EC" />
                <path id="Vector_192" d="M27.2126 3.50673C27.1393 3.59061 27.1485 3.71826 27.2328 3.7912C27.3171 3.86415 27.4455 3.85503 27.5188 3.77114C27.5921 3.68726 27.5829 3.55961 27.4986 3.48667C27.4143 3.41372 27.286 3.42284 27.2126 3.50673Z" fill="#91D7EC" />
                <path id="Vector_193" d="M28.5051 4.65372C28.5875 4.57896 28.5949 4.45131 28.5197 4.36925C28.4446 4.28719 28.3162 4.27989 28.2337 4.35466C28.1512 4.42942 28.1439 4.55707 28.2191 4.63914C28.2942 4.7212 28.4226 4.72849 28.5051 4.65372Z" fill="#91D7EC" />
                <path id="Vector_194" d="M29.3774 5.64759C29.4672 5.58194 29.4874 5.45611 29.4214 5.36676C29.3554 5.2774 29.2289 5.25734 29.139 5.32299C29.0492 5.38864 29.0291 5.51447 29.095 5.60382C29.161 5.69318 29.2875 5.71324 29.3774 5.64759Z" fill="#91D7EC" />
                <path id="Vector_195" d="M29.8743 6.67242C29.9403 6.76178 30.0668 6.78184 30.1567 6.71619C30.2465 6.65054 30.2667 6.52472 30.2007 6.43536C30.1347 6.34601 30.0082 6.32595 29.9183 6.39159C29.8285 6.45724 29.8083 6.58307 29.8743 6.67242Z" fill="#91D7EC" />
                <path id="Vector_196" d="M21.1937 2.79003C21.3055 2.79003 21.3954 2.69885 21.3954 2.58762C21.3954 2.47638 21.3037 2.38702 21.1919 2.38702C21.0801 2.38702 20.9902 2.4782 20.9902 2.58944C20.9902 2.70068 21.0819 2.79003 21.1937 2.79003Z" fill="#91D7EC" />
                <path id="Vector_197" d="M22.3211 2.54751C22.301 2.65692 22.3761 2.76086 22.4861 2.78092C22.5961 2.80098 22.7006 2.72622 22.7208 2.6168C22.741 2.50739 22.6658 2.40344 22.5558 2.38338C22.4458 2.36333 22.3413 2.43809 22.3211 2.54751Z" fill="#91D7EC" />
                <path id="Vector_198" d="M23.6393 2.74264C23.6008 2.84658 23.6558 2.96329 23.7603 3.00159C23.8647 3.03988 23.9821 2.98518 24.0206 2.88123C24.0591 2.77729 24.0041 2.66058 23.8996 2.62229C23.7951 2.58399 23.6778 2.6387 23.6393 2.74264Z" fill="#91D7EC" />
                <path id="Vector_199" d="M25.1759 3.0891C25.0788 3.03439 24.9541 3.06722 24.8991 3.16387C24.8441 3.26052 24.8771 3.38452 24.9743 3.43923C25.0714 3.49393 25.1961 3.46111 25.2511 3.36446C25.3061 3.26781 25.2731 3.14381 25.1759 3.0891Z" fill="#91D7EC" />
                <path id="Vector_200" d="M26.3545 3.76023C26.2665 3.69093 26.14 3.70552 26.0703 3.79305C26.0007 3.88058 26.0153 4.00641 26.1033 4.07571C26.1913 4.145 26.3178 4.13041 26.3875 4.04288C26.4571 3.95535 26.4425 3.82952 26.3545 3.76023Z" fill="#91D7EC" />
                <path id="Vector_201" d="M27.4105 4.88533C27.4911 4.80874 27.4948 4.68109 27.416 4.60085C27.339 4.52062 27.2107 4.51697 27.13 4.59538C27.0493 4.67197 27.0457 4.79962 27.1245 4.87986C27.2015 4.9601 27.3298 4.96374 27.4105 4.88533Z" fill="#91D7EC" />
                <path id="Vector_202" d="M28.3105 5.85183C28.4003 5.78436 28.4187 5.65853 28.3508 5.56917C28.283 5.47982 28.1565 5.46158 28.0667 5.52906C27.9768 5.59653 27.9585 5.72235 28.0263 5.81171C28.0942 5.90106 28.2207 5.9193 28.3105 5.85183Z" fill="#91D7EC" />
                <path id="Vector_203" d="M29.1098 6.90951C29.1996 6.84203 29.218 6.71621 29.1501 6.62685C29.0823 6.5375 28.9558 6.51926 28.866 6.58673C28.7762 6.65421 28.7578 6.78003 28.8257 6.86939C28.8935 6.95874 29.02 6.97698 29.1098 6.90951Z" fill="#91D7EC" />
                <path id="Vector_204" d="M19.9897 3.51399C20.1016 3.50487 20.184 3.4064 20.1749 3.29516C20.1657 3.18393 20.0667 3.10186 19.9549 3.11098C19.8431 3.1201 19.7606 3.21857 19.7697 3.32981C19.7789 3.44105 19.8779 3.52311 19.9897 3.51399Z" fill="#91D7EC" />
                <path id="Vector_205" d="M21.0933 3.18028C21.0823 3.29152 21.1648 3.38999 21.2766 3.39911C21.3884 3.40823 21.4874 3.32799 21.4966 3.21676C21.5076 3.10552 21.4251 3.00704 21.3133 2.99793C21.2014 2.98699 21.1024 3.06905 21.0933 3.18028Z" fill="#91D7EC" />
                <path id="Vector_206" d="M22.4221 3.26782C22.3909 3.37541 22.4533 3.48665 22.5614 3.51582C22.6696 3.54682 22.7814 3.48482 22.8107 3.37723C22.8419 3.26964 22.7796 3.1584 22.6714 3.12923C22.5632 3.10005 22.4514 3.16023 22.4221 3.26782Z" fill="#91D7EC" />
                <path id="Vector_207" d="M23.7112 3.59423C23.6617 3.69453 23.7038 3.81488 23.8047 3.86412C23.9055 3.91336 24.0265 3.87141 24.076 3.77112C24.1255 3.67082 24.0833 3.55047 23.9825 3.50123C23.8817 3.45199 23.7607 3.49394 23.7112 3.59423Z" fill="#91D7EC" />
                <path id="Vector_208" d="M25.2049 4.09575C25.1133 4.03193 24.9868 4.05199 24.9226 4.14316C24.8584 4.23434 24.8786 4.36017 24.9703 4.42399C25.0619 4.48782 25.1884 4.46776 25.2526 4.37658C25.3168 4.2854 25.2966 4.15958 25.2049 4.09575Z" fill="#91D7EC" />
                <path id="Vector_209" d="M26.0227 4.88718C25.9438 4.96741 25.9475 5.09506 26.0263 5.17165C26.1051 5.24824 26.2353 5.24642 26.3123 5.16801C26.3893 5.08777 26.3875 4.96012 26.3086 4.88353C26.228 4.80694 26.0996 4.80876 26.0227 4.88718Z" fill="#91D7EC" />
                <path id="Vector_210" d="M27.2471 6.10531C27.3351 6.03601 27.3497 5.91019 27.2801 5.82266C27.2104 5.73512 27.0839 5.72054 26.9959 5.78983C26.9079 5.85913 26.8933 5.98495 26.9629 6.07248C27.0326 6.16002 27.1591 6.1746 27.2471 6.10531Z" fill="#91D7EC" />
                <path id="Vector_211" d="M28.0684 7.14291C28.1563 7.07361 28.171 6.94778 28.1013 6.86025C28.0317 6.77272 27.9052 6.75813 27.8172 6.82743C27.7292 6.89672 27.7145 7.02255 27.7842 7.11008C27.8539 7.19761 27.9804 7.2122 28.0684 7.14291Z" fill="#91D7EC" />
                <path id="Vector_212" d="M18.8108 4.29084C18.9208 4.27261 18.9959 4.16866 18.9776 4.05925C18.9593 3.94983 18.8548 3.87507 18.7448 3.8933C18.6348 3.91154 18.5596 4.01548 18.5779 4.1249C18.5963 4.23431 18.7008 4.30908 18.8108 4.29084Z" fill="#91D7EC" />
                <path id="Vector_213" d="M19.8867 3.87693C19.8867 3.98817 19.9747 4.07935 20.0865 4.08117C20.1984 4.08117 20.29 3.99364 20.2919 3.8824C20.2919 3.77116 20.2039 3.67999 20.092 3.67816C19.9802 3.67816 19.8886 3.76569 19.8867 3.87693Z" fill="#91D7EC" />
                <path id="Vector_214" d="M21.2194 3.86051C21.1974 3.96992 21.267 4.07569 21.377 4.09757C21.487 4.11945 21.5934 4.05016 21.6154 3.94074C21.6374 3.83133 21.5677 3.72556 21.4577 3.70368C21.3477 3.6818 21.2414 3.75109 21.2194 3.86051Z" fill="#91D7EC" />
                <path id="Vector_215" d="M22.5287 4.08847C22.4865 4.19241 22.536 4.30912 22.6405 4.35106C22.745 4.393 22.8623 4.34377 22.9045 4.23982C22.9467 4.13588 22.8972 4.01917 22.7927 3.97723C22.6882 3.93529 22.5709 3.98452 22.5287 4.08847Z" fill="#91D7EC" />
                <path id="Vector_216" d="M23.7753 4.5553C23.7148 4.65013 23.7441 4.77413 23.8376 4.83431C23.9311 4.89449 24.0576 4.86531 24.1181 4.77231C24.1786 4.67931 24.1492 4.55348 24.0558 4.4933C23.9623 4.43312 23.8358 4.4623 23.7753 4.5553Z" fill="#91D7EC" />
                <path id="Vector_217" d="M25.2031 5.22087C25.1188 5.1461 24.9923 5.1534 24.9171 5.23728C24.842 5.32117 24.8493 5.44699 24.9336 5.52176C25.018 5.59653 25.1444 5.58923 25.2196 5.50535C25.2948 5.42146 25.2874 5.29564 25.2031 5.22087Z" fill="#91D7EC" />
                <path id="Vector_218" d="M26.1895 6.40439C26.2757 6.33327 26.2867 6.20562 26.2152 6.11992C26.1437 6.03421 26.0154 6.02327 25.9292 6.09439C25.843 6.1655 25.832 6.29315 25.9035 6.37886C25.975 6.46457 26.1034 6.47551 26.1895 6.40439Z" fill="#91D7EC" />
                <path id="Vector_219" d="M27.0421 7.41831C27.1282 7.34719 27.1392 7.21954 27.0677 7.13383C26.9962 7.04812 26.8679 7.03718 26.7817 7.1083C26.6956 7.17942 26.6846 7.30707 26.7561 7.39278C26.8276 7.47849 26.9559 7.48943 27.0421 7.41831Z" fill="#91D7EC" />
                <path id="Vector_220" d="M17.6648 5.10781C17.7729 5.08228 17.8426 4.97469 17.8169 4.86528C17.7913 4.75769 17.6831 4.68839 17.5731 4.71392C17.4631 4.73945 17.3953 4.84704 17.421 4.95645C17.4466 5.06405 17.5548 5.13334 17.6648 5.10781Z" fill="#91D7EC" />
                <path id="Vector_221" d="M18.7099 4.62273C18.7172 4.73396 18.8126 4.81967 18.9244 4.81238C19.0362 4.80508 19.1224 4.71026 19.1151 4.59902C19.1077 4.48778 19.0124 4.40207 18.9006 4.40937C18.7887 4.41666 18.7026 4.51149 18.7099 4.62273Z" fill="#91D7EC" />
                <path id="Vector_222" d="M20.0374 4.5097C20.0227 4.62094 20.1016 4.72124 20.2116 4.73583C20.3234 4.75041 20.4242 4.672 20.4389 4.56259C20.4535 4.45135 20.3747 4.35105 20.2647 4.33646C20.1529 4.32188 20.0521 4.40029 20.0374 4.5097Z" fill="#91D7EC" />
                <path id="Vector_223" d="M21.3628 4.64284C21.3279 4.7486 21.3848 4.86349 21.4911 4.89814C21.5974 4.93279 21.7129 4.87625 21.7478 4.77049C21.7826 4.66472 21.7258 4.54984 21.6194 4.51519C21.5131 4.48054 21.3976 4.53707 21.3628 4.64284Z" fill="#91D7EC" />
                <path id="Vector_224" d="M22.6383 5.02392C22.5834 5.12057 22.6182 5.24457 22.7172 5.29746C22.8162 5.35034 22.939 5.31751 22.9922 5.21904C23.0453 5.12057 23.0123 4.99839 22.9133 4.94551C22.8143 4.89262 22.6915 4.92545 22.6383 5.02392Z" fill="#91D7EC" />
                <path id="Vector_225" d="M24.1031 5.60933C24.0169 5.53821 23.8886 5.5528 23.8171 5.6385C23.7456 5.72421 23.7603 5.85186 23.8464 5.92298C23.9326 5.9941 24.0609 5.97951 24.1324 5.8938C24.2039 5.8081 24.1892 5.68045 24.1031 5.60933Z" fill="#91D7EC" />
                <path id="Vector_226" d="M24.8712 6.44815C24.7887 6.52291 24.7814 6.65056 24.8547 6.73262C24.9281 6.81469 25.0582 6.82198 25.1407 6.74904C25.2232 6.67609 25.2305 6.54662 25.1572 6.46456C25.0839 6.3825 24.9537 6.37521 24.8712 6.44815Z" fill="#91D7EC" />
                <path id="Vector_227" d="M26.0279 7.73195C26.1104 7.65718 26.1177 7.52953 26.0444 7.44747C25.9711 7.36541 25.8409 7.35812 25.7584 7.43106C25.6759 7.504 25.6686 7.63347 25.7419 7.71554C25.8171 7.7976 25.9454 7.80489 26.0279 7.73195Z" fill="#91D7EC" />
                <path id="Vector_228" d="M16.5543 5.94484C16.6624 5.91384 16.7229 5.80078 16.6917 5.69501C16.6606 5.58742 16.5469 5.52724 16.4406 5.55824C16.3324 5.58925 16.2719 5.70231 16.3031 5.80807C16.3343 5.91566 16.4479 5.97584 16.5543 5.94484Z" fill="#91D7EC" />
                <path id="Vector_229" d="M17.5696 5.40506C17.5843 5.5163 17.6851 5.59471 17.7951 5.58012C17.9069 5.56554 17.9857 5.46524 17.9711 5.35583C17.9564 5.24459 17.8556 5.16617 17.7456 5.18076C17.6356 5.19535 17.5549 5.29565 17.5696 5.40506Z" fill="#91D7EC" />
                <path id="Vector_230" d="M18.8857 5.20632C18.8784 5.31756 18.9645 5.41238 19.0763 5.41968C19.1882 5.42697 19.2835 5.34126 19.2908 5.23003C19.2982 5.11879 19.212 5.02396 19.1002 5.01667C18.9884 5.00937 18.893 5.09508 18.8857 5.20632Z" fill="#91D7EC" />
                <path id="Vector_231" d="M20.2188 5.24823C20.1913 5.35582 20.2554 5.46523 20.3636 5.49441C20.4717 5.52176 20.5817 5.45794 20.6111 5.35035C20.6386 5.24276 20.5744 5.13334 20.4662 5.10416C20.3581 5.07681 20.2481 5.14064 20.2188 5.24823Z" fill="#91D7EC" />
                <path id="Vector_232" d="M21.5164 5.54363C21.4669 5.64393 21.509 5.76429 21.6098 5.81352C21.7107 5.86276 21.8317 5.82082 21.8812 5.72052C21.9307 5.62022 21.8885 5.49987 21.7877 5.45063C21.6868 5.4014 21.5659 5.44334 21.5164 5.54363Z" fill="#91D7EC" />
                <path id="Vector_233" d="M22.7319 6.08707C22.6659 6.17643 22.6843 6.30226 22.7741 6.36973C22.8639 6.4372 22.9904 6.41714 23.0582 6.32779C23.1261 6.23843 23.1059 6.1126 23.0161 6.04513C22.9262 5.97948 22.7998 5.99772 22.7319 6.08707Z" fill="#91D7EC" />
                <path id="Vector_234" d="M24.1086 6.85113C24.0316 6.77089 23.9033 6.76907 23.8226 6.84566C23.742 6.92225 23.7402 7.0499 23.8171 7.13013C23.8941 7.21037 24.0225 7.2122 24.1031 7.13561C24.1838 7.05902 24.1856 6.93137 24.1086 6.85113Z" fill="#91D7EC" />
                <path id="Vector_235" d="M25.0255 8.08751C25.1062 8.01092 25.108 7.88327 25.031 7.80303C24.954 7.7228 24.8257 7.72097 24.745 7.79756C24.6643 7.87415 24.6625 8.0018 24.7395 8.08204C24.8165 8.16228 24.9448 8.1641 25.0255 8.08751Z" fill="#91D7EC" />
                <path id="Vector_236" d="M15.4798 6.7928C15.5861 6.75633 15.6411 6.64145 15.6045 6.53568C15.5678 6.42991 15.4523 6.3752 15.346 6.41168C15.2396 6.44815 15.1846 6.56303 15.2213 6.6688C15.258 6.77457 15.3735 6.82927 15.4798 6.7928Z" fill="#91D7EC" />
                <path id="Vector_237" d="M16.4696 6.20743C16.4898 6.31685 16.5961 6.38979 16.7061 6.36973C16.8161 6.34967 16.8895 6.2439 16.8693 6.13449C16.8491 6.02507 16.7428 5.95213 16.6328 5.97219C16.5228 5.99225 16.4495 6.09802 16.4696 6.20743Z" fill="#91D7EC" />
                <path id="Vector_238" d="M17.7715 5.93392C17.7715 6.04516 17.8631 6.13452 17.975 6.13452C18.0868 6.13452 18.1766 6.04334 18.1766 5.9321C18.1766 5.82086 18.085 5.73151 17.9731 5.73151C17.8613 5.73151 17.7715 5.82268 17.7715 5.93392Z" fill="#91D7EC" />
                <path id="Vector_239" d="M19.1041 5.89381C19.0821 6.00322 19.1536 6.10899 19.2636 6.13087C19.3736 6.15275 19.4799 6.08164 19.5019 5.97222C19.5239 5.86281 19.4524 5.75704 19.3424 5.73516C19.2324 5.71327 19.1261 5.78439 19.1041 5.89381Z" fill="#91D7EC" />
                <path id="Vector_240" d="M20.4186 6.10898C20.3765 6.2111 20.4241 6.32963 20.5286 6.3734C20.6313 6.41534 20.7504 6.36793 20.7944 6.26398C20.8384 6.16004 20.7889 6.04333 20.6844 5.99957C20.5799 5.9558 20.4626 6.00504 20.4186 6.10898Z" fill="#91D7EC" />
                <path id="Vector_241" d="M21.6635 6.58126C21.6011 6.67427 21.6268 6.79827 21.7203 6.86027C21.8138 6.92227 21.9384 6.89674 22.0008 6.80374C22.0631 6.71074 22.0374 6.58673 21.9439 6.52473C21.8505 6.46273 21.7258 6.48826 21.6635 6.58126Z" fill="#91D7EC" />
                <path id="Vector_242" d="M23.0787 7.28151C22.9981 7.20492 22.8697 7.20674 22.7927 7.28698C22.7157 7.36722 22.7176 7.49487 22.7982 7.57146C22.8789 7.64805 23.0072 7.64622 23.0842 7.56599C23.1612 7.48575 23.1594 7.3581 23.0787 7.28151Z" fill="#91D7EC" />
                <path id="Vector_243" d="M23.7478 8.20245C23.6708 8.28268 23.6726 8.41033 23.7533 8.48692C23.834 8.56351 23.9623 8.56169 24.0393 8.48145C24.1163 8.40122 24.1145 8.27357 24.0338 8.19698C23.9531 8.12039 23.8248 8.12221 23.7478 8.20245Z" fill="#91D7EC" />
                <path id="Vector_244" d="M14.435 7.64074C14.457 7.61885 14.4826 7.60062 14.5138 7.58968C14.5651 7.53497 14.5853 7.45473 14.5559 7.37997C14.5156 7.27602 14.3983 7.22496 14.2938 7.26508C14.1893 7.3052 14.138 7.42191 14.1783 7.52585C14.2186 7.62797 14.3323 7.67903 14.435 7.64256V7.64074Z" fill="#91D7EC" />
                <path id="Vector_245" d="M15.4062 7.01894C15.4319 7.12653 15.54 7.19401 15.65 7.1703C15.7582 7.14477 15.826 7.03718 15.8022 6.92777C15.7765 6.82018 15.6684 6.7527 15.5584 6.77641C15.4484 6.80012 15.3824 6.90953 15.4062 7.01894Z" fill="#91D7EC" />
                <path id="Vector_246" d="M16.6953 6.68523C16.7008 6.79646 16.7979 6.88217 16.9097 6.87488C17.0216 6.86941 17.1077 6.77276 17.1004 6.66152C17.0949 6.55028 16.9977 6.46457 16.8859 6.47187C16.7741 6.47734 16.6879 6.57399 16.6953 6.68523Z" fill="#91D7EC" />
                <path id="Vector_247" d="M18.0223 6.57212C18.0076 6.68154 18.0846 6.78366 18.1946 6.80007C18.3046 6.81466 18.4073 6.73807 18.4238 6.62865C18.4384 6.51924 18.3614 6.41712 18.2515 6.40071C18.1415 6.38612 18.0388 6.46271 18.0223 6.57212Z" fill="#91D7EC" />
                <path id="Vector_248" d="M19.3478 6.71258C19.3111 6.81835 19.3661 6.93324 19.4706 6.96971C19.5769 7.00618 19.6924 6.95147 19.7291 6.84753C19.7658 6.74176 19.7108 6.62688 19.6063 6.5904C19.4999 6.55393 19.3845 6.60864 19.3478 6.71258Z" fill="#91D7EC" />
                <path id="Vector_249" d="M20.6167 7.11919C20.5599 7.21402 20.5892 7.33802 20.6864 7.39637C20.7817 7.45291 20.9063 7.42373 20.965 7.32708C21.0237 7.23043 20.9925 7.10825 20.8953 7.0499C20.8 6.99337 20.6754 7.02254 20.6167 7.11919Z" fill="#91D7EC" />
                <path id="Vector_250" d="M21.777 7.76841C21.7018 7.85229 21.7092 7.97812 21.7935 8.05289C21.8778 8.12765 22.0043 8.12036 22.0795 8.03648C22.1546 7.95259 22.1473 7.82676 22.063 7.752C21.9786 7.67723 21.8522 7.68453 21.777 7.76841Z" fill="#91D7EC" />
                <path id="Vector_251" d="M22.7687 8.64738C22.6935 8.73126 22.7009 8.85709 22.7852 8.93185C22.8695 9.00662 22.996 8.99933 23.0712 8.91544C23.1463 8.83156 23.139 8.70573 23.0547 8.63097C22.9703 8.5562 22.8439 8.56349 22.7687 8.64738Z" fill="#91D7EC" />
                <path id="Vector_252" d="M13.4099 8.48145C13.4338 8.43586 13.4759 8.39939 13.5291 8.38298C13.5291 8.38298 13.5309 8.38298 13.5328 8.38298C13.5584 8.33192 13.5658 8.27174 13.5419 8.21339C13.4979 8.11127 13.3788 8.06203 13.2761 8.1058C13.1735 8.14956 13.124 8.26809 13.168 8.37021C13.2083 8.46504 13.3128 8.51063 13.4099 8.48328V8.48145Z" fill="#91D7EC" />
                <path id="Vector_253" d="M14.4347 7.64078C14.3871 7.69002 14.3651 7.75931 14.3834 7.83043C14.4127 7.93802 14.5245 8.00185 14.6327 7.97085C14.7409 7.93984 14.805 7.83043 14.7739 7.72284C14.7427 7.61525 14.6327 7.55142 14.5245 7.58243C14.519 7.58243 14.5172 7.5879 14.5117 7.5879C14.4805 7.59884 14.4549 7.61707 14.4329 7.63896L14.4347 7.64078Z" fill="#91D7EC" />
                <path id="Vector_254" d="M15.6592 7.44931C15.6702 7.56055 15.771 7.64079 15.881 7.62984C15.991 7.6189 16.0735 7.51861 16.0625 7.40919C16.0515 7.29796 15.9507 7.21772 15.8407 7.22866C15.7307 7.2396 15.6482 7.3399 15.6592 7.44931Z" fill="#91D7EC" />
                <path id="Vector_255" d="M16.9777 7.27423C16.9686 7.38547 17.0511 7.48211 17.1629 7.49306C17.2747 7.504 17.3719 7.42011 17.3829 7.30888C17.3939 7.19764 17.3096 7.10099 17.1977 7.09005C17.0859 7.08093 16.9887 7.16299 16.9777 7.27423Z" fill="#91D7EC" />
                <path id="Vector_256" d="M18.3087 7.34718C18.2757 7.45295 18.338 7.56601 18.4443 7.59883C18.5506 7.63166 18.6643 7.56966 18.6973 7.46389C18.7303 7.35812 18.668 7.24506 18.5616 7.21224C18.4553 7.17941 18.3417 7.24141 18.3087 7.34718Z" fill="#91D7EC" />
                <path id="Vector_257" d="M19.9528 7.88144C20.006 7.78297 19.9693 7.66079 19.8722 7.60791C19.775 7.55503 19.6503 7.5915 19.5972 7.68815C19.544 7.78662 19.5807 7.9088 19.6778 7.96168C19.775 8.01456 19.8997 7.97809 19.9528 7.88144Z" fill="#91D7EC" />
                <path id="Vector_258" d="M21.0986 8.54523C21.1701 8.45952 21.1573 8.33187 21.0711 8.26075C20.9849 8.18963 20.8566 8.2024 20.7851 8.28811C20.7136 8.37381 20.7264 8.50146 20.8126 8.57258C20.8988 8.6437 21.0271 8.63094 21.0986 8.54523Z" fill="#91D7EC" />
                <path id="Vector_259" d="M21.8081 9.13064C21.7366 9.21634 21.7494 9.34399 21.8356 9.41511C21.9217 9.48623 22.05 9.47347 22.1215 9.38776C22.193 9.30205 22.1802 9.1744 22.094 9.10328C22.0079 9.03216 21.8796 9.04493 21.8081 9.13064Z" fill="#91D7EC" />
                <path id="Vector_260" d="M12.4456 9.30022C12.4639 9.24186 12.5061 9.1908 12.5702 9.17074C12.5831 9.12698 12.5849 9.07774 12.5629 9.03215C12.5171 8.93003 12.3979 8.88444 12.2952 8.93003C12.1926 8.97562 12.1467 9.09415 12.1926 9.19627C12.2366 9.29292 12.3466 9.33669 12.4456 9.30204V9.30022Z" fill="#91D7EC" />
                <path id="Vector_261" d="M13.4103 8.48141C13.3865 8.527 13.3791 8.5817 13.3956 8.63459C13.4286 8.74035 13.5423 8.80053 13.6486 8.76771C13.7549 8.73488 13.8154 8.62182 13.7824 8.51605C13.7494 8.41029 13.6394 8.35193 13.5331 8.38293C13.5331 8.38293 13.5313 8.38293 13.5294 8.38293C13.4763 8.39935 13.4341 8.43582 13.4103 8.48141Z" fill="#91D7EC" />
                <path id="Vector_262" d="M14.6585 8.2152C14.675 8.32462 14.7777 8.40121 14.8877 8.38662C14.9977 8.37021 15.0747 8.26809 15.06 8.15867C15.0435 8.04926 14.9408 7.97267 14.8309 7.98726C14.7209 8.00367 14.6439 8.10579 14.6585 8.2152Z" fill="#91D7EC" />
                <path id="Vector_263" d="M15.9709 7.9909C15.9654 8.10213 16.0534 8.19696 16.1653 8.20061C16.2771 8.20608 16.3724 8.11855 16.3761 8.00731C16.3816 7.89607 16.2936 7.80124 16.1818 7.7976C16.0699 7.79395 15.9746 7.87966 15.9709 7.9909Z" fill="#91D7EC" />
                <path id="Vector_264" d="M17.4503 8.25351C17.5584 8.28086 17.6684 8.21521 17.6959 8.10762C17.7234 8.00003 17.6574 7.89062 17.5493 7.86326C17.4411 7.83591 17.3311 7.90156 17.3036 8.00915C17.2761 8.11674 17.3421 8.22615 17.4503 8.25351Z" fill="#91D7EC" />
                <path id="Vector_265" d="M18.9702 8.47233C19.0197 8.37204 18.9775 8.25168 18.8785 8.20244C18.7777 8.15321 18.6567 8.19515 18.6072 8.29362C18.5577 8.3921 18.5999 8.51427 18.6989 8.56351C18.7979 8.61275 18.9207 8.5708 18.9702 8.47233Z" fill="#91D7EC" />
                <path id="Vector_266" d="M20.1381 9.0887C20.2059 9.00117 20.1912 8.87352 20.1014 8.80604C20.0134 8.73857 19.8851 8.75316 19.8173 8.84252C19.7494 8.93005 19.7641 9.0577 19.8539 9.12517C19.9419 9.19264 20.0702 9.17805 20.1381 9.0887Z" fill="#91D7EC" />
                <path id="Vector_267" d="M21.1884 9.89833C21.2562 9.8108 21.2415 9.68315 21.1517 9.61568C21.0637 9.5482 20.9354 9.56279 20.8675 9.65215C20.7997 9.73968 20.8144 9.86733 20.9042 9.9348C20.9922 10.0023 21.1205 9.98768 21.1884 9.89833Z" fill="#91D7EC" />
                <path id="Vector_268" d="M11.5165 10.0989C11.5275 10.0369 11.566 9.98405 11.6247 9.95487C11.632 9.91475 11.632 9.87281 11.6137 9.83269C11.566 9.73239 11.4468 9.68863 11.3442 9.73422C11.2433 9.78163 11.1993 9.90016 11.2452 10.0023C11.2928 10.1026 11.412 10.1463 11.5147 10.1008L11.5165 10.0989Z" fill="#91D7EC" />
                <path id="Vector_269" d="M12.4459 9.30023C12.4331 9.34035 12.4294 9.38229 12.4441 9.42424C12.4789 9.53 12.5944 9.58653 12.7007 9.55189C12.807 9.51724 12.8639 9.40235 12.829 9.29659C12.7942 9.19082 12.6787 9.13429 12.5724 9.16894C12.5101 9.19082 12.4679 9.24006 12.4477 9.29841L12.4459 9.30023Z" fill="#91D7EC" />
                <path id="Vector_270" d="M13.6962 8.97925C13.7145 9.08867 13.8208 9.16161 13.9308 9.14337C14.0408 9.12514 14.1141 9.01937 14.0958 8.90996C14.0775 8.80054 13.9712 8.7276 13.8612 8.74583C13.7512 8.76407 13.6778 8.86984 13.6962 8.97925Z" fill="#91D7EC" />
                <path id="Vector_271" d="M15.2031 8.91905C15.3149 8.91905 15.4066 8.8297 15.4084 8.71846C15.4103 8.60722 15.3186 8.51604 15.2068 8.51422C15.095 8.51422 15.0033 8.60358 15.0015 8.71481C15.0015 8.82605 15.0913 8.91723 15.2031 8.91905Z" fill="#91D7EC" />
                <path id="Vector_272" d="M16.7302 8.77137C16.7541 8.66195 16.6844 8.55619 16.5744 8.53248C16.4644 8.50877 16.3581 8.57807 16.3343 8.68748C16.3104 8.7969 16.3801 8.90266 16.4901 8.92637C16.6001 8.95008 16.7064 8.88078 16.7302 8.77137Z" fill="#91D7EC" />
                <path id="Vector_273" d="M18.0152 9.09047C18.061 8.98835 18.0152 8.86982 17.9144 8.82423C17.8117 8.77864 17.6925 8.82423 17.6467 8.92453C17.6009 9.02665 17.6467 9.14518 17.7475 9.19077C17.8502 9.23636 17.9694 9.19077 18.0152 9.09047Z" fill="#91D7EC" />
                <path id="Vector_274" d="M19.2065 9.66858C19.2725 9.57922 19.2523 9.45157 19.1625 9.38775C19.0727 9.3221 18.9444 9.34216 18.8802 9.43152C18.8142 9.52087 18.8344 9.64852 18.9242 9.71234C19.014 9.77799 19.1424 9.75793 19.2065 9.66858Z" fill="#91D7EC" />
                <path id="Vector_275" d="M20.2773 10.4472C20.3433 10.3579 20.3231 10.2302 20.2333 10.1664C20.1435 10.1007 20.0152 10.1208 19.951 10.2101C19.885 10.2995 19.9052 10.4271 19.995 10.491C20.0848 10.5566 20.2132 10.5366 20.2773 10.4472Z" fill="#91D7EC" />
                <path id="Vector_276" d="M10.6016 10.8776C10.6126 10.8721 10.6199 10.863 10.6291 10.8575C10.6364 10.8028 10.6658 10.7554 10.7116 10.7226C10.7171 10.6861 10.7153 10.6478 10.6969 10.6113C10.6493 10.511 10.5283 10.4673 10.4274 10.5147C10.3266 10.5621 10.2826 10.6825 10.3303 10.7828C10.378 10.8831 10.4989 10.9268 10.5998 10.8794L10.6016 10.8776Z" fill="#91D7EC" />
                <path id="Vector_277" d="M11.5183 10.0971C11.5128 10.1299 11.5128 10.1628 11.5238 10.1956C11.5604 10.3014 11.6759 10.3561 11.7822 10.3196C11.8886 10.2831 11.9436 10.1682 11.9069 10.0625C11.8702 9.95671 11.7547 9.902 11.6484 9.93847C11.6393 9.94212 11.6338 9.94759 11.6264 9.95124C11.5678 9.98041 11.5274 10.0333 11.5183 10.0953V10.0971Z" fill="#91D7EC" />
                <path id="Vector_278" d="M13.0084 9.8929C13.1184 9.87101 13.1899 9.76525 13.1679 9.65583C13.1459 9.54642 13.0396 9.4753 12.9296 9.49718C12.8196 9.51906 12.7481 9.62483 12.7701 9.73424C12.7921 9.84366 12.8984 9.91478 13.0084 9.8929Z" fill="#91D7EC" />
                <path id="Vector_279" d="M14.277 9.64302C14.3888 9.6412 14.4787 9.54819 14.4768 9.43696C14.475 9.32572 14.3815 9.23636 14.2697 9.23819C14.1578 9.24001 14.068 9.33301 14.0699 9.44425C14.0717 9.55549 14.1652 9.64484 14.277 9.64302Z" fill="#91D7EC" />
                <path id="Vector_280" d="M15.564 9.6157C15.6739 9.63576 15.7803 9.56282 15.8004 9.4534C15.8206 9.34399 15.7473 9.23822 15.6373 9.21816C15.5273 9.1981 15.421 9.27105 15.4008 9.38046C15.3806 9.48988 15.454 9.59564 15.564 9.6157Z" fill="#91D7EC" />
                <path id="Vector_281" d="M17.0932 9.73606C17.1372 9.63394 17.0877 9.51541 16.985 9.47164C16.8824 9.42788 16.7632 9.47711 16.7192 9.57923C16.6752 9.68135 16.7247 9.79988 16.8274 9.84365C16.93 9.88742 17.0492 9.83818 17.0932 9.73606Z" fill="#91D7EC" />
                <path id="Vector_282" d="M18.2995 10.2813C18.3636 10.1901 18.3398 10.0643 18.2481 10.0005C18.1565 9.93666 18.03 9.96036 17.9658 10.0515C17.9017 10.1427 17.9255 10.2685 18.0172 10.3324C18.1088 10.3962 18.2353 10.3725 18.2995 10.2813Z" fill="#91D7EC" />
                <path id="Vector_283" d="M19.3918 11.0326C19.4559 10.9414 19.4321 10.8156 19.3404 10.7518C19.2488 10.6879 19.1223 10.7116 19.0581 10.8028C18.9939 10.894 19.0178 11.0198 19.1094 11.0837C19.2011 11.1475 19.3276 11.1238 19.3918 11.0326Z" fill="#91D7EC" />
                <path id="Vector_284" d="M9.71615 11.6307C9.73998 11.6198 9.75831 11.6034 9.77481 11.587C9.78031 11.5468 9.79681 11.5104 9.82431 11.4794C9.82981 11.4411 9.82981 11.401 9.81147 11.3627C9.76381 11.2624 9.64282 11.2186 9.54199 11.2678C9.44116 11.3153 9.39716 11.4356 9.44666 11.5359C9.49433 11.6362 9.61532 11.68 9.71615 11.6307Z" fill="#91D7EC" />
                <path id="Vector_285" d="M10.6311 10.8557C10.6274 10.8867 10.6274 10.9177 10.6384 10.9487C10.6769 11.0527 10.7924 11.1074 10.8969 11.0709C11.0014 11.0326 11.0564 10.9177 11.0197 10.8138C10.9831 10.7098 10.8658 10.6551 10.7613 10.6916C10.7429 10.6989 10.7283 10.7098 10.7136 10.7208C10.6678 10.7536 10.6384 10.801 10.6311 10.8557Z" fill="#91D7EC" />
                <path id="Vector_286" d="M11.8811 10.4782C11.905 10.5876 12.0113 10.6569 12.1213 10.6332C12.2313 10.6095 12.3009 10.5037 12.2771 10.3943C12.2533 10.2849 12.147 10.2156 12.037 10.2393C11.927 10.263 11.8573 10.3688 11.8811 10.4782Z" fill="#91D7EC" />
                <path id="Vector_287" d="M13.3864 10.3652C13.4982 10.3615 13.5862 10.2667 13.5807 10.1555C13.577 10.0442 13.4817 9.95669 13.3699 9.96216C13.258 9.9658 13.17 10.0606 13.1755 10.1719C13.1792 10.2831 13.2745 10.3706 13.3864 10.3652Z" fill="#91D7EC" />
                <path id="Vector_288" d="M14.9044 10.1482C14.9227 10.0387 14.8475 9.93479 14.7375 9.91656C14.6275 9.89832 14.523 9.97309 14.5047 10.0825C14.4864 10.1919 14.5615 10.2959 14.6715 10.3141C14.7815 10.3323 14.886 10.2576 14.9044 10.1482Z" fill="#91D7EC" />
                <path id="Vector_289" d="M16.2055 10.4017C16.2458 10.2977 16.1945 10.181 16.0918 10.1409C15.9873 10.1008 15.87 10.1518 15.8297 10.254C15.7894 10.3579 15.8407 10.4746 15.9434 10.5147C16.0478 10.5548 16.1652 10.5038 16.2055 10.4017Z" fill="#91D7EC" />
                <path id="Vector_290" d="M17.4192 10.9214C17.4816 10.8284 17.4559 10.7043 17.3624 10.6423C17.2689 10.5803 17.1442 10.6059 17.0819 10.6989C17.0196 10.7919 17.0453 10.9159 17.1387 10.9779C17.2322 11.0399 17.3569 11.0144 17.4192 10.9214Z" fill="#91D7EC" />
                <path id="Vector_291" d="M18.5267 11.6526C18.589 11.5596 18.5633 11.4356 18.4698 11.3736C18.3763 11.3116 18.2517 11.3371 18.1893 11.4301C18.127 11.5231 18.1527 11.6471 18.2462 11.7091C18.3397 11.7711 18.4643 11.7456 18.5267 11.6526Z" fill="#91D7EC" />
                <path id="Vector_292" d="M8.86003 12.3602C8.96085 12.3128 9.00485 12.1924 8.95719 12.0921C8.90952 11.9918 8.78853 11.9481 8.6877 11.9955C8.58687 12.0429 8.54288 12.1632 8.59054 12.2635C8.6382 12.3638 8.7592 12.4076 8.86003 12.3602Z" fill="#91D7EC" />
                <path id="Vector_293" d="M9.78394 11.68C9.82244 11.7839 9.93793 11.8386 10.0424 11.8022C10.1469 11.7639 10.2019 11.649 10.1653 11.545C10.1268 11.4411 10.0113 11.3864 9.90677 11.4229C9.87377 11.4338 9.8481 11.4557 9.8261 11.4794C9.79861 11.5104 9.78211 11.5469 9.77661 11.587C9.77294 11.618 9.77294 11.649 9.78394 11.6818V11.68Z" fill="#91D7EC" />
                <path id="Vector_294" d="M11.0252 11.2076C11.049 11.3171 11.1572 11.3845 11.2672 11.3626C11.3772 11.3389 11.445 11.2313 11.423 11.1219C11.3992 11.0125 11.291 10.9432 11.181 10.9669C11.071 10.9906 11.0013 11.0982 11.0252 11.2076Z" fill="#91D7EC" />
                <path id="Vector_295" d="M12.7228 10.874C12.7173 10.7627 12.6219 10.677 12.5101 10.6825C12.3983 10.688 12.3121 10.7828 12.3176 10.894C12.3231 11.0053 12.4185 11.091 12.5303 11.0855C12.6421 11.08 12.7283 10.9852 12.7228 10.874Z" fill="#91D7EC" />
                <path id="Vector_296" d="M14.0482 10.852C14.0647 10.7426 13.9877 10.6387 13.8777 10.6223C13.7678 10.6059 13.6633 10.6824 13.6468 10.7919C13.6303 10.9013 13.7073 11.0052 13.8172 11.0216C13.9272 11.038 14.0317 10.9615 14.0482 10.852Z" fill="#91D7EC" />
                <path id="Vector_297" d="M15.0874 11.2059C15.1919 11.246 15.3092 11.1931 15.3477 11.0892C15.3862 10.9852 15.3349 10.8685 15.2304 10.8302C15.1259 10.7901 15.0085 10.843 14.97 10.9469C14.9297 11.0509 14.9829 11.1676 15.0874 11.2059Z" fill="#91D7EC" />
                <path id="Vector_298" d="M16.2938 11.6508C16.3873 11.7109 16.5138 11.6836 16.5743 11.5906C16.6348 11.4976 16.6073 11.3718 16.5138 11.3116C16.4203 11.2514 16.2938 11.2788 16.2333 11.3718C16.1728 11.4648 16.2003 11.5906 16.2938 11.6508Z" fill="#91D7EC" />
                <path id="Vector_299" d="M17.4081 12.3693C17.5016 12.4295 17.6281 12.4021 17.6886 12.3091C17.7491 12.2161 17.7216 12.0903 17.6281 12.0301C17.5346 11.9699 17.4081 11.9973 17.3476 12.0903C17.2871 12.1833 17.3146 12.3091 17.4081 12.3693Z" fill="#91D7EC" />
                <path id="Vector_300" d="M8.03322 13.0604C8.13404 13.013 8.17804 12.8945 8.13221 12.7923C8.08455 12.6921 7.96539 12.6483 7.86273 12.6939C7.7619 12.7413 7.7179 12.8598 7.76373 12.9619C7.8114 13.0622 7.93056 13.106 8.03322 13.0604Z" fill="#91D7EC" />
                <path id="Vector_301" d="M8.96102 12.3875C8.99768 12.4933 9.11501 12.548 9.2195 12.5097C9.32583 12.4732 9.38082 12.3565 9.34233 12.2525C9.30383 12.1486 9.18834 12.0921 9.08384 12.1304C8.97751 12.1668 8.92252 12.2835 8.96102 12.3875Z" fill="#91D7EC" />
                <path id="Vector_302" d="M10.4459 12.0757C10.5559 12.0519 10.6255 11.9444 10.6017 11.8349C10.5779 11.7255 10.4697 11.6562 10.3597 11.6799C10.2497 11.7036 10.1801 11.8112 10.2039 11.9207C10.2277 12.0301 10.3359 12.0994 10.4459 12.0757Z" fill="#91D7EC" />
                <path id="Vector_303" d="M11.7105 11.7985C11.8223 11.793 11.9085 11.6982 11.903 11.587C11.8975 11.4757 11.8021 11.39 11.6903 11.3955C11.5785 11.401 11.4923 11.4958 11.4978 11.607C11.5033 11.7183 11.5986 11.804 11.7105 11.7985Z" fill="#91D7EC" />
                <path id="Vector_304" d="M12.8269 11.5031C12.8104 11.6125 12.8874 11.7146 12.9993 11.731C13.1111 11.7475 13.2119 11.6709 13.2284 11.5596C13.2449 11.4502 13.1679 11.3481 13.0561 11.3317C12.9461 11.3153 12.8434 11.3919 12.8269 11.5031Z" fill="#91D7EC" />
                <path id="Vector_305" d="M14.411 11.5304C14.3065 11.4921 14.1892 11.545 14.1507 11.6489C14.1122 11.7529 14.1654 11.8696 14.2699 11.9079C14.3744 11.9462 14.4917 11.8933 14.5302 11.7894C14.5687 11.6854 14.5155 11.5687 14.411 11.5304Z" fill="#91D7EC" />
                <path id="Vector_306" d="M15.4777 12.3492C15.5712 12.4094 15.6977 12.382 15.7582 12.2872C15.8187 12.1942 15.7912 12.0684 15.6959 12.0082C15.6024 11.948 15.4759 11.9754 15.4154 12.0702C15.3549 12.1632 15.3824 12.289 15.4777 12.3492Z" fill="#91D7EC" />
                <path id="Vector_307" d="M16.5963 13.0604C16.6898 13.1206 16.8163 13.0932 16.8768 12.9984C16.9373 12.9054 16.9098 12.7796 16.8145 12.7194C16.721 12.6592 16.5945 12.6866 16.534 12.7814C16.4735 12.8744 16.501 13.0002 16.5963 13.0604Z" fill="#91D7EC" />
                <path id="Vector_308" d="M7.2374 13.7333C7.34006 13.6877 7.38406 13.5673 7.33823 13.467C7.2924 13.3649 7.17141 13.3212 7.07058 13.3668C6.96792 13.4123 6.92392 13.5327 6.96975 13.633C7.01558 13.7351 7.13658 13.7789 7.2374 13.7333Z" fill="#91D7EC" />
                <path id="Vector_309" d="M8.43292 13.1972C8.53924 13.1607 8.59424 13.0458 8.55758 12.94C8.52091 12.8343 8.40542 12.7796 8.29909 12.816C8.19276 12.8525 8.13777 12.9674 8.17443 13.0732C8.2111 13.1789 8.32659 13.2336 8.43292 13.1972Z" fill="#91D7EC" />
                <path id="Vector_310" d="M9.66279 12.7723C9.77279 12.7486 9.84245 12.6428 9.81862 12.5334C9.79479 12.424 9.68846 12.3547 9.57847 12.3784C9.46847 12.4021 9.39881 12.5078 9.42264 12.6173C9.44647 12.7267 9.5528 12.796 9.66279 12.7723Z" fill="#91D7EC" />
                <path id="Vector_311" d="M10.9115 12.103C10.7997 12.1085 10.7135 12.2015 10.719 12.3127C10.7245 12.424 10.818 12.5097 10.9298 12.5042C11.0416 12.4987 11.1278 12.4057 11.1223 12.2945C11.1168 12.1833 11.0233 12.0976 10.9115 12.103Z" fill="#91D7EC" />
                <path id="Vector_312" d="M12.0462 12.2143C12.0297 12.3237 12.1067 12.4276 12.2167 12.4441C12.3267 12.4605 12.4312 12.3839 12.4476 12.2745C12.4641 12.1651 12.3872 12.0611 12.2772 12.0447C12.1672 12.0283 12.0627 12.1049 12.0462 12.2143Z" fill="#91D7EC" />
                <path id="Vector_313" d="M13.7494 12.5079C13.7879 12.4039 13.7348 12.2872 13.6303 12.2489C13.5258 12.2106 13.4084 12.2635 13.37 12.3674C13.3315 12.4714 13.3846 12.5881 13.4891 12.6264C13.5936 12.6647 13.7109 12.6118 13.7494 12.5079Z" fill="#91D7EC" />
                <path id="Vector_314" d="M14.9757 13.0094C15.0362 12.9163 15.0087 12.7905 14.9152 12.7303C14.8217 12.6702 14.6952 12.6975 14.6347 12.7905C14.5742 12.8835 14.6017 13.0094 14.6952 13.0695C14.7887 13.1297 14.9152 13.1024 14.9757 13.0094Z" fill="#91D7EC" />
                <path id="Vector_315" d="M15.8099 13.7844C15.9034 13.8445 16.0299 13.8172 16.0904 13.7242C16.1509 13.6312 16.1234 13.5054 16.0299 13.4452C15.9364 13.385 15.8099 13.4124 15.7494 13.5054C15.6889 13.5984 15.7164 13.7242 15.8099 13.7844Z" fill="#91D7EC" />
                <path id="Vector_316" d="M6.47849 14.3789C6.58115 14.3351 6.62882 14.2166 6.58482 14.1144C6.54082 14.0123 6.42166 13.9649 6.319 14.0087C6.21634 14.0524 6.16868 14.171 6.21268 14.2731C6.25667 14.3752 6.37583 14.4226 6.47849 14.3789Z" fill="#91D7EC" />
                <path id="Vector_317" d="M7.67921 13.8591C7.78554 13.8245 7.84421 13.7096 7.80754 13.6038C7.77271 13.498 7.65722 13.4397 7.55089 13.4762C7.44456 13.5108 7.3859 13.6257 7.42256 13.7315C7.45739 13.8372 7.57289 13.8956 7.67921 13.8591Z" fill="#91D7EC" />
                <path id="Vector_318" d="M8.83778 13.0568C8.72779 13.0786 8.65629 13.1844 8.67829 13.2938C8.70029 13.4032 8.80662 13.4743 8.91661 13.4525C9.02661 13.4306 9.0981 13.3248 9.0761 13.2154C9.0541 13.106 8.94778 13.0349 8.83778 13.0568Z" fill="#91D7EC" />
                <path id="Vector_319" d="M10.1871 13.2026C10.299 13.199 10.3869 13.106 10.3833 12.9947C10.3796 12.8835 10.2861 12.796 10.1743 12.7996C10.0625 12.8033 9.97447 12.8963 9.97814 13.0075C9.9818 13.1187 10.0753 13.2063 10.1871 13.2026Z" fill="#91D7EC" />
                <path id="Vector_320" d="M11.5383 12.7595C11.4283 12.7413 11.3238 12.816 11.3055 12.9273C11.2872 13.0385 11.3623 13.1406 11.4741 13.1589C11.586 13.1771 11.6886 13.1023 11.707 12.9911C11.7253 12.8799 11.6501 12.7777 11.5383 12.7595Z" fill="#91D7EC" />
                <path id="Vector_321" d="M13.0066 13.2409C13.047 13.137 12.9956 13.0203 12.8911 12.9802C12.7866 12.9401 12.6693 12.9911 12.629 13.0951C12.5887 13.199 12.64 13.3157 12.7445 13.3558C12.849 13.3959 12.9663 13.3449 13.0066 13.2409Z" fill="#91D7EC" />
                <path id="Vector_322" d="M14.2258 13.7534C14.2882 13.6604 14.2607 13.5345 14.1672 13.4744C14.0737 13.4142 13.9472 13.4397 13.8867 13.5327C13.8262 13.6257 13.8519 13.7515 13.9454 13.8117C14.0389 13.8719 14.1654 13.8464 14.2258 13.7534Z" fill="#91D7EC" />
                <path id="Vector_323" d="M15.0546 14.5375C15.1481 14.5995 15.2746 14.5721 15.3351 14.4791C15.3956 14.3861 15.3699 14.2603 15.2764 14.2001C15.1829 14.1381 15.0564 14.1655 14.9959 14.2585C14.9336 14.3515 14.9611 14.4773 15.0546 14.5375Z" fill="#91D7EC" />
                <path id="Vector_324" d="M5.75462 14.9952C5.85728 14.9533 5.90678 14.8347 5.86462 14.7326C5.82245 14.6305 5.70329 14.5812 5.60063 14.6232C5.49797 14.6651 5.44847 14.7837 5.49064 14.8858C5.5328 14.9879 5.65196 15.0371 5.75462 14.9952Z" fill="#91D7EC" />
                <path id="Vector_325" d="M6.96464 14.4992C7.07097 14.4664 7.13146 14.3533 7.09846 14.2476C7.06547 14.1418 6.95181 14.0816 6.84548 14.1144C6.73915 14.1473 6.67865 14.2603 6.71165 14.3661C6.74465 14.4719 6.85831 14.532 6.96464 14.4992Z" fill="#91D7EC" />
                <path id="Vector_326" d="M8.13948 13.7187C8.02948 13.7388 7.95615 13.8427 7.97449 13.9522C7.99465 14.0616 8.09915 14.1345 8.20914 14.1163C8.31913 14.0962 8.39246 13.9923 8.37413 13.8829C8.35397 13.7734 8.24947 13.7005 8.13948 13.7187Z" fill="#91D7EC" />
                <path id="Vector_327" d="M9.47963 13.4871C9.36781 13.4871 9.27798 13.5802 9.27981 13.6914C9.27981 13.8026 9.37331 13.892 9.48513 13.8902C9.59696 13.8902 9.68679 13.7972 9.68496 13.6859C9.68496 13.5747 9.59146 13.4853 9.47963 13.4871Z" fill="#91D7EC" />
                <path id="Vector_328" d="M10.8474 13.4743C10.7374 13.4543 10.631 13.5272 10.6127 13.6366C10.5925 13.746 10.6659 13.8518 10.7759 13.87C10.8859 13.8901 10.9922 13.8172 11.0105 13.7077C11.0307 13.5983 10.9574 13.4926 10.8474 13.4743Z" fill="#91D7EC" />
                <path id="Vector_329" d="M12.3044 13.9849C12.3466 13.881 12.2971 13.7643 12.1926 13.7223C12.0881 13.6804 11.9708 13.7296 11.9286 13.8336C11.8864 13.9375 11.9359 14.0542 12.0404 14.0962C12.1449 14.1381 12.2622 14.0889 12.3044 13.9849Z" fill="#91D7EC" />
                <path id="Vector_330" d="M13.5126 14.5211C13.575 14.4299 13.5511 14.3041 13.4595 14.2402C13.3678 14.1782 13.2413 14.2019 13.1771 14.2931C13.113 14.3843 13.1386 14.5101 13.2303 14.574C13.322 14.636 13.4485 14.6123 13.5126 14.5211Z" fill="#91D7EC" />
                <path id="Vector_331" d="M14.6109 15.2669C14.6733 15.1758 14.6494 15.0499 14.5578 14.9861C14.4661 14.9223 14.3396 14.9478 14.2755 15.039C14.2131 15.1302 14.237 15.256 14.3286 15.3198C14.4203 15.3818 14.5468 15.3581 14.6109 15.2669Z" fill="#91D7EC" />
                <path id="Vector_332" d="M5.20475 15.408C5.20891 15.2963 5.12124 15.2023 5.00893 15.1982C4.89662 15.1941 4.80221 15.2813 4.79805 15.393C4.7939 15.5047 4.88157 15.5986 4.99388 15.6028C5.10618 15.6069 5.2006 15.5197 5.20475 15.408Z" fill="#91D7EC" />
                <path id="Vector_333" d="M6.29543 15.1174C6.40359 15.0864 6.46592 14.9752 6.43476 14.8694C6.40359 14.7618 6.29177 14.6998 6.18544 14.7308C6.07728 14.7618 6.01495 14.8731 6.04611 14.9788C6.07728 15.0846 6.1891 15.1484 6.29543 15.1174Z" fill="#91D7EC" />
                <path id="Vector_334" d="M7.48864 14.3661C7.37864 14.3825 7.30165 14.4846 7.31815 14.5959C7.33464 14.7053 7.43731 14.7819 7.54913 14.7654C7.66096 14.749 7.73612 14.6469 7.71962 14.5357C7.70312 14.4244 7.60046 14.3497 7.48864 14.3661Z" fill="#91D7EC" />
                <path id="Vector_335" d="M8.82677 14.574C8.9386 14.574 9.03026 14.4864 9.0321 14.3752C9.0321 14.264 8.9441 14.1728 8.83227 14.171C8.72045 14.171 8.62879 14.2585 8.62695 14.3697C8.62695 14.481 8.71495 14.5721 8.82677 14.574Z" fill="#91D7EC" />
                <path id="Vector_336" d="M10.1174 14.5886C10.2274 14.6123 10.3338 14.5412 10.3576 14.4336C10.3814 14.3242 10.3099 14.2184 10.2018 14.1947C10.0936 14.171 9.98545 14.2421 9.96162 14.3497C9.93779 14.4573 10.0093 14.5649 10.1174 14.5886Z" fill="#91D7EC" />
                <path id="Vector_337" d="M11.5403 14.4773C11.4376 14.4317 11.3185 14.4773 11.2726 14.5812C11.2268 14.6834 11.2726 14.8019 11.3771 14.8475C11.4798 14.8931 11.5989 14.8475 11.6448 14.7435C11.6906 14.6396 11.6448 14.5229 11.5403 14.4773Z" fill="#91D7EC" />
                <path id="Vector_338" d="M12.8381 15.3125C12.9041 15.2214 12.8821 15.0955 12.7923 15.0317C12.7006 14.9661 12.5741 14.9879 12.5099 15.0773C12.4439 15.1685 12.4659 15.2943 12.5558 15.3581C12.6474 15.4238 12.7739 15.4019 12.8381 15.3125Z" fill="#91D7EC" />
                <path id="Vector_339" d="M13.9162 16.0821C13.9822 15.9909 13.9602 15.8651 13.8704 15.8012C13.7787 15.7356 13.6522 15.7575 13.5881 15.8468C13.5221 15.938 13.5441 16.0638 13.6339 16.1277C13.7256 16.1933 13.8521 16.1714 13.9162 16.0821Z" fill="#91D7EC" />
                <path id="Vector_340" d="M4.43825 16.1477C4.54458 16.1112 4.59957 15.9945 4.56108 15.8906C4.52441 15.7848 4.40709 15.7301 4.30259 15.7684C4.19626 15.8049 4.14127 15.9216 4.17977 16.0255C4.21643 16.1313 4.33376 16.186 4.43825 16.1477Z" fill="#91D7EC" />
                <path id="Vector_341" d="M5.67181 15.7119C5.77997 15.6845 5.84597 15.5751 5.81847 15.4675C5.79097 15.3599 5.68098 15.2943 5.57282 15.3216C5.46466 15.349 5.39866 15.4584 5.42616 15.566C5.45366 15.6736 5.56365 15.7392 5.67181 15.7119Z" fill="#91D7EC" />
                <path id="Vector_342" d="M6.8872 14.9952C6.77537 15.008 6.69654 15.1083 6.70938 15.2177C6.72221 15.3289 6.82304 15.4073 6.93303 15.3946C7.04486 15.3818 7.12369 15.2815 7.11085 15.1721C7.09802 15.0608 6.99719 14.9824 6.8872 14.9952Z" fill="#91D7EC" />
                <path id="Vector_343" d="M8.24025 14.842C8.12842 14.8366 8.03309 14.9223 8.02759 15.0335C8.02209 15.1448 8.10825 15.2396 8.22008 15.2451C8.33191 15.2505 8.42724 15.1648 8.43274 15.0536C8.43824 14.9423 8.35207 14.8475 8.24025 14.842Z" fill="#91D7EC" />
                <path id="Vector_344" d="M9.60442 14.915C9.49626 14.8876 9.38627 14.9532 9.35877 15.0627C9.33127 15.1703 9.39727 15.2797 9.50726 15.307C9.61542 15.3344 9.72542 15.2687 9.75292 15.1593C9.78041 15.0517 9.71442 14.9423 9.60442 14.915Z" fill="#91D7EC" />
                <path id="Vector_345" d="M10.662 15.3398C10.6125 15.4401 10.6565 15.5605 10.7573 15.6097C10.8581 15.659 10.9791 15.6152 11.0286 15.5149C11.0781 15.4146 11.0341 15.2943 10.9333 15.245C10.8325 15.1958 10.7115 15.2395 10.662 15.3398Z" fill="#91D7EC" />
                <path id="Vector_346" d="M12.1632 15.8414C12.0752 15.7739 11.9469 15.7903 11.8791 15.8797C11.8112 15.9672 11.8277 16.0948 11.9176 16.1623C12.0074 16.2298 12.1339 16.2134 12.2017 16.124C12.2695 16.0347 12.253 15.9088 12.1632 15.8414Z" fill="#91D7EC" />
                <path id="Vector_347" d="M13.2559 16.9282C13.3237 16.8407 13.3072 16.713 13.2174 16.6456C13.1276 16.5781 13.0011 16.5945 12.9333 16.6839C12.8654 16.7732 12.8819 16.899 12.9718 16.9665C13.0598 17.034 13.1881 17.0176 13.2559 16.9282Z" fill="#91D7EC" />
                <path id="Vector_348" d="M3.8552 16.6857C3.96153 16.651 4.02019 16.538 3.98536 16.4322C3.95053 16.3264 3.83687 16.2681 3.73054 16.3027C3.62421 16.3374 3.56555 16.4504 3.60038 16.5562C3.63521 16.662 3.74887 16.7203 3.8552 16.6857Z" fill="#91D7EC" />
                <path id="Vector_349" d="M5.01548 15.8906C4.90548 15.9143 4.83582 16.02 4.85965 16.1295C4.88349 16.2389 4.98981 16.3082 5.09981 16.2845C5.2098 16.2608 5.27946 16.1532 5.25563 16.0456C5.2318 15.9362 5.12364 15.8669 5.01548 15.8906Z" fill="#91D7EC" />
                <path id="Vector_350" d="M6.34099 15.6116C6.22916 15.6207 6.14484 15.7173 6.154 15.8286C6.16317 15.9398 6.26033 16.0237 6.37216 16.0146C6.48398 16.0055 6.56831 15.9088 6.55915 15.7976C6.54998 15.6863 6.45282 15.6025 6.34099 15.6116Z" fill="#91D7EC" />
                <path id="Vector_351" d="M7.69949 15.5113C7.58766 15.5004 7.48867 15.5824 7.4795 15.6937C7.4685 15.8049 7.551 15.9034 7.66282 15.9125C7.77465 15.9234 7.87364 15.8414 7.88281 15.7301C7.89381 15.6189 7.81131 15.5204 7.69949 15.5113Z" fill="#91D7EC" />
                <path id="Vector_352" d="M9.05816 15.6408C8.95 15.6098 8.83817 15.6699 8.80701 15.7775C8.77584 15.8851 8.83634 15.9964 8.9445 16.0274C9.05266 16.0584 9.16448 15.9982 9.19565 15.8906C9.22681 15.783 9.16632 15.6718 9.05816 15.6408Z" fill="#91D7EC" />
                <path id="Vector_353" d="M10.1817 16.3848C10.2807 16.4377 10.4035 16.3994 10.4567 16.3027C10.5098 16.2042 10.4713 16.0821 10.3742 16.0292C10.2752 15.9763 10.1524 16.0146 10.0992 16.1112C10.046 16.2097 10.0845 16.3319 10.1817 16.3848Z" fill="#91D7EC" />
                <path id="Vector_354" d="M11.5769 16.6748C11.4908 16.6036 11.3625 16.6164 11.291 16.7021C11.2195 16.7878 11.2323 16.9155 11.3185 16.9866C11.4046 17.0577 11.533 17.0449 11.6044 16.9592C11.6759 16.8735 11.6631 16.7459 11.5769 16.6748Z" fill="#91D7EC" />
                <path id="Vector_355" d="M12.6289 17.7962C12.7004 17.7105 12.6875 17.5828 12.6014 17.5117C12.5152 17.4406 12.3869 17.4534 12.3154 17.5391C12.2439 17.6248 12.2567 17.7524 12.3429 17.8236C12.429 17.8947 12.5574 17.8819 12.6289 17.7962Z" fill="#91D7EC" />
                <path id="Vector_356" d="M3.329 17.1981C3.43716 17.1671 3.49949 17.0559 3.46833 16.9483C3.43716 16.8407 3.32534 16.7787 3.21718 16.8097C3.10902 16.8407 3.04669 16.9519 3.07785 17.0595C3.10902 17.1671 3.22084 17.2291 3.329 17.1981Z" fill="#91D7EC" />
                <path id="Vector_357" d="M4.35044 16.6766C4.36878 16.786 4.4751 16.8607 4.5851 16.8407C4.69509 16.8224 4.77025 16.7167 4.75009 16.6073C4.73175 16.4978 4.62543 16.4231 4.51543 16.4431C4.40544 16.4614 4.33028 16.5671 4.35044 16.6766Z" fill="#91D7EC" />
                <path id="Vector_358" d="M5.65734 16.4249C5.661 16.5362 5.7545 16.6237 5.86632 16.62C5.97815 16.6164 6.06615 16.5234 6.06248 16.4122C6.05881 16.3009 5.96532 16.2134 5.85349 16.217C5.74167 16.2207 5.65367 16.3137 5.65734 16.4249Z" fill="#91D7EC" />
                <path id="Vector_359" d="M6.98465 16.3501C6.96815 16.4596 7.04514 16.5617 7.15697 16.5781C7.26696 16.5945 7.36963 16.5179 7.38612 16.4067C7.40262 16.2954 7.32563 16.1951 7.2138 16.1787C7.10197 16.1623 7.00115 16.2389 6.98465 16.3501Z" fill="#91D7EC" />
                <path id="Vector_360" d="M8.30822 16.4997C8.27156 16.6054 8.32655 16.7203 8.43288 16.7568C8.53921 16.7933 8.6547 16.7386 8.69136 16.6328C8.72803 16.527 8.67303 16.4121 8.56671 16.3757C8.46038 16.3392 8.34488 16.3939 8.30822 16.4997Z" fill="#91D7EC" />
                <path id="Vector_361" d="M9.92895 17.1051C9.98578 17.0103 9.95461 16.8863 9.85928 16.8279C9.76396 16.7714 9.6393 16.8024 9.58063 16.8972C9.5238 16.992 9.55497 17.116 9.6503 17.1744C9.74562 17.2309 9.87028 17.1999 9.92895 17.1051Z" fill="#91D7EC" />
                <path id="Vector_362" d="M11.0307 17.5264C10.9483 17.4516 10.8199 17.4589 10.7448 17.5428C10.6696 17.6248 10.6769 17.7525 10.7613 17.8272C10.8438 17.902 10.9721 17.8947 11.0472 17.8108C11.1224 17.7288 11.1151 17.6011 11.0307 17.5264Z" fill="#91D7EC" />
                <path id="Vector_363" d="M12.035 18.6934C12.1102 18.6113 12.1029 18.4837 12.0185 18.4089C11.936 18.3342 11.8077 18.3414 11.7326 18.4253C11.6574 18.5074 11.6647 18.635 11.7491 18.7098C11.8316 18.7846 11.9599 18.7773 12.035 18.6934Z" fill="#91D7EC" />
                <path id="Vector_364" d="M2.86371 17.6886C2.97187 17.6631 3.0397 17.5537 3.01221 17.4461C2.98654 17.3385 2.87655 17.271 2.76839 17.2984C2.66023 17.3239 2.5924 17.4333 2.61989 17.5409C2.64556 17.6485 2.75555 17.716 2.86371 17.6886Z" fill="#91D7EC" />
                <path id="Vector_365" d="M3.90459 17.2072C3.91925 17.3185 4.02008 17.3969 4.13007 17.3823C4.2419 17.3677 4.32073 17.2674 4.30606 17.158C4.2914 17.0486 4.19057 16.9683 4.08058 16.9829C3.96875 16.9975 3.88992 17.0978 3.90459 17.2072Z" fill="#91D7EC" />
                <path id="Vector_366" d="M5.42067 17.22C5.5325 17.2218 5.62599 17.1343 5.62783 17.023C5.62966 16.9118 5.54167 16.8188 5.42984 16.817C5.31801 16.8152 5.22452 16.9027 5.22268 17.0139C5.22085 17.1252 5.30885 17.2182 5.42067 17.22Z" fill="#91D7EC" />
                <path id="Vector_367" d="M6.55378 17.0084C6.53178 17.1178 6.60328 17.2236 6.71327 17.2455C6.82327 17.2674 6.92959 17.1963 6.95159 17.0868C6.97359 16.9774 6.90209 16.8717 6.7921 16.8498C6.68211 16.8279 6.57578 16.899 6.55378 17.0084Z" fill="#91D7EC" />
                <path id="Vector_368" d="M7.86637 17.2309C7.82421 17.333 7.87187 17.4515 7.97637 17.4935C8.07903 17.5354 8.19819 17.488 8.24035 17.3841C8.28252 17.282 8.23485 17.1634 8.13036 17.1215C8.0277 17.0795 7.90854 17.127 7.86637 17.2309Z" fill="#91D7EC" />
                <path id="Vector_369" d="M9.16777 17.9804C9.26127 18.0424 9.38593 18.0168 9.44826 17.9257C9.51058 17.8327 9.48492 17.7087 9.39326 17.6467C9.29976 17.5847 9.1751 17.6102 9.11277 17.7014C9.05044 17.7944 9.07611 17.9184 9.16777 17.9804Z" fill="#91D7EC" />
                <path id="Vector_370" d="M10.5266 18.4035C10.4459 18.325 10.3176 18.3269 10.2406 18.4071C10.1618 18.4873 10.1636 18.615 10.2443 18.6916C10.3249 18.77 10.4533 18.7682 10.5303 18.6879C10.6091 18.6077 10.6073 18.48 10.5266 18.4035Z" fill="#91D7EC" />
                <path id="Vector_371" d="M11.1884 19.3298C11.1095 19.4101 11.1114 19.5377 11.192 19.6143C11.2727 19.6927 11.401 19.6909 11.478 19.6107C11.5568 19.5304 11.555 19.4028 11.4743 19.3262C11.3937 19.2478 11.2654 19.2496 11.1884 19.3298Z" fill="#91D7EC" />
                <path id="Vector_372" d="M2.46593 18.1609C2.57592 18.139 2.64742 18.0333 2.62542 17.9238C2.60342 17.8144 2.49709 17.7433 2.3871 17.7652C2.27711 17.7871 2.20561 17.8928 2.22761 18.0023C2.24961 18.1117 2.35594 18.1828 2.46593 18.1609Z" fill="#91D7EC" />
                <path id="Vector_373" d="M3.74532 17.9111C3.85715 17.9038 3.94148 17.8071 3.93231 17.6959C3.92498 17.5847 3.82782 17.5008 3.71599 17.5099C3.60416 17.5172 3.51984 17.6138 3.529 17.7251C3.53634 17.8363 3.6335 17.9202 3.74532 17.9111Z" fill="#91D7EC" />
                <path id="Vector_374" d="M5.0709 17.4151C4.95907 17.406 4.86191 17.4881 4.85275 17.5993C4.84358 17.7105 4.92608 17.8072 5.0379 17.8163C5.14973 17.8254 5.24689 17.7434 5.25606 17.6321C5.26522 17.5209 5.18273 17.4242 5.0709 17.4151Z" fill="#91D7EC" />
                <path id="Vector_375" d="M6.57385 17.7743C6.60318 17.6667 6.53902 17.5555 6.43086 17.5281C6.3227 17.4989 6.21087 17.5628 6.18338 17.6704C6.15404 17.778 6.21821 17.8892 6.32637 17.9165C6.43453 17.9457 6.54635 17.8819 6.57385 17.7743Z" fill="#91D7EC" />
                <path id="Vector_376" d="M7.7491 17.8819C7.64827 17.8327 7.52728 17.8746 7.47778 17.9749C7.42828 18.0752 7.47045 18.1956 7.57127 18.2448C7.6721 18.294 7.79309 18.2521 7.84259 18.1518C7.89209 18.0515 7.84992 17.9311 7.7491 17.8819Z" fill="#91D7EC" />
                <path id="Vector_377" d="M9.01586 18.7645C9.08369 18.6752 9.06536 18.5493 8.97553 18.4819C8.8857 18.4144 8.75921 18.4326 8.69138 18.522C8.62355 18.6113 8.64188 18.7372 8.73171 18.8046C8.82154 18.8721 8.94803 18.8539 9.01586 18.7645Z" fill="#91D7EC" />
                <path id="Vector_378" d="M10.0646 19.2988C9.9876 19.2168 9.85928 19.2131 9.77862 19.2879C9.69612 19.3645 9.69245 19.4921 9.76762 19.5724C9.84461 19.6544 9.97294 19.6581 10.0536 19.5833C10.1361 19.5067 10.1398 19.3791 10.0646 19.2988Z" fill="#91D7EC" />
                <path id="Vector_379" d="M10.9589 20.5498C11.0414 20.4732 11.045 20.3456 10.9699 20.2653C10.8929 20.1833 10.7646 20.1796 10.6839 20.2544C10.6014 20.331 10.5977 20.4586 10.6729 20.5389C10.7499 20.6209 10.8782 20.6246 10.9589 20.5498Z" fill="#91D7EC" />
                <path id="Vector_380" d="M2.13915 18.6204C2.24914 18.604 2.32614 18.5019 2.31147 18.3925C2.2968 18.2831 2.19231 18.2065 2.08232 18.2211C1.97232 18.2357 1.89533 18.3396 1.90999 18.449C1.92649 18.5584 2.02915 18.635 2.13915 18.6204Z" fill="#91D7EC" />
                <path id="Vector_381" d="M3.46658 18.4304C3.57652 18.4072 3.64674 18.2998 3.62344 18.1904C3.60013 18.081 3.49211 18.0112 3.38217 18.0344C3.27223 18.0576 3.202 18.165 3.22531 18.2744C3.24862 18.3837 3.35664 18.4536 3.46658 18.4304Z" fill="#91D7EC" />
                <path id="Vector_382" d="M4.55203 18.1865C4.53553 18.2959 4.61253 18.3998 4.72252 18.4162C4.83252 18.4326 4.93701 18.356 4.95351 18.2466C4.97001 18.1372 4.89301 18.0333 4.78302 18.0169C4.67302 18.0005 4.56853 18.077 4.55203 18.1865Z" fill="#91D7EC" />
                <path id="Vector_383" d="M5.87345 18.3469C5.83678 18.4527 5.89361 18.5676 5.99994 18.6022C6.10626 18.6387 6.22176 18.5822 6.25659 18.4764C6.29325 18.3706 6.23642 18.2558 6.1301 18.2211C6.02377 18.1846 5.90828 18.2412 5.87345 18.3469Z" fill="#91D7EC" />
                <path id="Vector_384" d="M7.1457 18.739C7.0907 18.8357 7.1237 18.9597 7.22086 19.0144C7.31802 19.0691 7.44268 19.0362 7.49768 18.9396C7.55267 18.8429 7.51968 18.7189 7.42252 18.6642C7.32535 18.6095 7.20069 18.6424 7.1457 18.739Z" fill="#91D7EC" />
                <path id="Vector_385" d="M8.31934 19.3645C8.24784 19.4502 8.25701 19.576 8.34317 19.6489C8.42933 19.7201 8.55582 19.7109 8.62915 19.6252C8.70248 19.5395 8.69148 19.4137 8.60532 19.3408C8.51916 19.2696 8.39267 19.2788 8.31934 19.3645Z" fill="#91D7EC" />
                <path id="Vector_386" d="M9.61704 20.5024C9.7032 20.4313 9.71237 20.3036 9.64087 20.2179C9.56938 20.1322 9.44105 20.1231 9.35489 20.1942C9.26873 20.2653 9.25956 20.393 9.33106 20.4787C9.40255 20.5644 9.53088 20.5735 9.61704 20.5024Z" fill="#91D7EC" />
                <path id="Vector_387" d="M10.4749 21.5108C10.5611 21.4397 10.5703 21.312 10.4988 21.2263C10.4273 21.1406 10.299 21.1315 10.2128 21.2026C10.1266 21.2737 10.1175 21.4014 10.189 21.4871C10.2605 21.5728 10.3888 21.5819 10.4749 21.5108Z" fill="#91D7EC" />
                <path id="Vector_388" d="M1.88475 19.0709C1.99657 19.0618 2.07907 18.9633 2.0699 18.852C2.06073 18.7408 1.96174 18.6587 1.84991 18.6679C1.73809 18.677 1.65559 18.7755 1.66476 18.8867C1.67392 18.9979 1.77292 19.08 1.88475 19.0709Z" fill="#91D7EC" />
                <path id="Vector_389" d="M3.1787 18.9578C3.29053 18.9633 3.38586 18.8794 3.39136 18.7682C3.39686 18.6569 3.31253 18.5621 3.2007 18.5566C3.08887 18.5512 2.99355 18.6351 2.98805 18.7463C2.98255 18.8575 3.06688 18.9524 3.1787 18.9578Z" fill="#91D7EC" />
                <path id="Vector_390" d="M4.71519 18.8739C4.73902 18.7645 4.67119 18.6569 4.5612 18.6332C4.45121 18.6095 4.34305 18.677 4.31922 18.7864C4.29538 18.8958 4.36321 19.0034 4.47321 19.0271C4.5832 19.0508 4.69136 18.9833 4.71519 18.8739Z" fill="#91D7EC" />
                <path id="Vector_391" d="M5.62625 19.0399C5.58225 19.142 5.62992 19.2606 5.73258 19.3043C5.83524 19.3481 5.9544 19.3007 5.99839 19.1986C6.04239 19.0964 5.99473 18.9779 5.89207 18.9341C5.78941 18.8904 5.67025 18.9378 5.62625 19.0399Z" fill="#91D7EC" />
                <path id="Vector_392" d="M6.86561 19.5232C6.80328 19.6162 6.82895 19.7402 6.92244 19.8022C7.01594 19.8642 7.14059 19.8386 7.20292 19.7456C7.26525 19.6526 7.23959 19.5286 7.14609 19.4666C7.0526 19.4046 6.92794 19.4302 6.86561 19.5232Z" fill="#91D7EC" />
                <path id="Vector_393" d="M7.99272 20.2288C7.91572 20.3091 7.91755 20.4367 8.00005 20.5133C8.08254 20.5899 8.20904 20.5881 8.28603 20.506C8.36303 20.4258 8.36119 20.2981 8.2787 20.2215C8.19804 20.145 8.06971 20.1468 7.99272 20.2288Z" fill="#91D7EC" />
                <path id="Vector_394" d="M9.22292 21.4415C9.31091 21.374 9.32741 21.2464 9.25958 21.1589C9.19175 21.0713 9.06343 21.0549 8.97543 21.1224C8.88744 21.1899 8.87094 21.3175 8.93877 21.405C9.0066 21.4926 9.13492 21.509 9.22292 21.4415Z" fill="#91D7EC" />
                <path id="Vector_395" d="M10.0335 22.4883C10.1215 22.4208 10.138 22.2931 10.0701 22.2056C10.0023 22.1181 9.87397 22.1017 9.78598 22.1691C9.69798 22.2366 9.68148 22.3643 9.74931 22.4518C9.81714 22.5393 9.94547 22.5557 10.0335 22.4883Z" fill="#91D7EC" />
                <path id="Vector_396" d="M1.70677 19.5213C1.8186 19.5195 1.90843 19.4265 1.90476 19.3153C1.9011 19.204 1.80944 19.1147 1.69761 19.1183C1.58578 19.1202 1.49595 19.2132 1.49962 19.3244C1.50145 19.4356 1.59495 19.525 1.70677 19.5213Z" fill="#91D7EC" />
                <path id="Vector_397" d="M3.05769 19.0927C2.94586 19.0782 2.84503 19.1566 2.83037 19.2678C2.8157 19.3791 2.89453 19.4793 3.00636 19.4939C3.11819 19.5085 3.21901 19.4301 3.23368 19.3189C3.24834 19.2076 3.16952 19.1073 3.05769 19.0927Z" fill="#91D7EC" />
                <path id="Vector_398" d="M4.54085 19.5213C4.57384 19.4155 4.51335 19.3025 4.40702 19.2696C4.30069 19.2368 4.18703 19.297 4.15404 19.4028C4.12104 19.5085 4.18153 19.6216 4.28786 19.6544C4.39419 19.6872 4.50785 19.6271 4.54085 19.5213Z" fill="#91D7EC" />
                <path id="Vector_399" d="M5.43729 19.7566C5.38596 19.855 5.42445 19.9772 5.52345 20.0283C5.62244 20.0794 5.74527 20.0411 5.7966 19.9426C5.84793 19.8441 5.80943 19.7219 5.71044 19.6709C5.61144 19.6198 5.48862 19.6581 5.43729 19.7566Z" fill="#91D7EC" />
                <path id="Vector_400" d="M6.63464 20.3365C6.56681 20.424 6.58147 20.5517 6.6713 20.6191C6.7593 20.6866 6.88762 20.672 6.95545 20.5827C7.02328 20.4951 7.00862 20.3675 6.91879 20.3C6.83079 20.2325 6.70247 20.2471 6.63464 20.3365Z" fill="#91D7EC" />
                <path id="Vector_401" d="M7.70684 21.1206C7.62434 21.1972 7.62068 21.3248 7.69584 21.4051C7.771 21.4853 7.90116 21.4908 7.98182 21.416C8.06249 21.3413 8.06798 21.2118 7.99282 21.1315C7.91583 21.0495 7.7875 21.0458 7.70684 21.1206Z" fill="#91D7EC" />
                <path id="Vector_402" d="M8.86544 22.4007C8.9571 22.3369 8.9791 22.2111 8.91494 22.1199C8.85077 22.0287 8.72428 22.0068 8.63262 22.0707C8.54096 22.1345 8.51896 22.2603 8.58312 22.3515C8.64729 22.4427 8.77378 22.4646 8.86544 22.4007Z" fill="#91D7EC" />
                <path id="Vector_403" d="M9.63009 23.4821C9.72175 23.4183 9.74375 23.2924 9.67959 23.2013C9.61542 23.1101 9.48893 23.0882 9.39727 23.152C9.30561 23.2158 9.28361 23.3417 9.34777 23.4329C9.41193 23.524 9.53843 23.5459 9.63009 23.4821Z" fill="#91D7EC" />
                <path id="Vector_404" d="M1.60241 19.9827C1.71423 19.9881 1.80956 19.9024 1.81506 19.7912C1.82056 19.68 1.7344 19.5851 1.62257 19.5797C1.51074 19.5742 1.41542 19.6599 1.40992 19.7711C1.40442 19.8824 1.49058 19.9772 1.60241 19.9827Z" fill="#91D7EC" />
                <path id="Vector_405" d="M2.74043 19.8058C2.7166 19.9152 2.78809 20.021 2.89625 20.0447C3.00441 20.0684 3.11258 19.9973 3.13641 19.8897C3.16024 19.7803 3.08874 19.6745 2.98058 19.6508C2.87059 19.6271 2.76426 19.6982 2.74043 19.8058Z" fill="#91D7EC" />
                <path id="Vector_406" d="M4.31539 19.9334C4.2109 19.8915 4.09357 19.9425 4.05141 20.0446C4.00924 20.1486 4.06057 20.2653 4.16323 20.3072C4.26773 20.3492 4.38505 20.2981 4.42722 20.196C4.46938 20.0921 4.41805 19.9754 4.31539 19.9334Z" fill="#91D7EC" />
                <path id="Vector_407" d="M5.29976 20.5061C5.2411 20.6009 5.2686 20.7249 5.36393 20.7832C5.45926 20.8416 5.58391 20.8143 5.64258 20.7194C5.70124 20.6246 5.67374 20.5006 5.57841 20.4422C5.48309 20.3839 5.35843 20.4112 5.29976 20.5061Z" fill="#91D7EC" />
                <path id="Vector_408" d="M6.73338 21.1644C6.64906 21.0896 6.52256 21.0969 6.4474 21.1808C6.37224 21.2646 6.37957 21.3905 6.4639 21.4652C6.54823 21.54 6.67472 21.5327 6.74988 21.4488C6.82505 21.3649 6.81771 21.2391 6.73338 21.1644Z" fill="#91D7EC" />
                <path id="Vector_409" d="M7.74545 22.0634C7.67396 21.9777 7.54563 21.9667 7.45947 22.0379C7.37331 22.109 7.36231 22.2366 7.43381 22.3223C7.5053 22.4081 7.63363 22.419 7.71979 22.3479C7.80595 22.2768 7.81695 22.1491 7.74545 22.0634Z" fill="#91D7EC" />
                <path id="Vector_410" d="M8.54649 23.3782C8.63999 23.318 8.66748 23.194 8.60699 23.0991C8.54649 23.0043 8.42183 22.9788 8.3265 23.039C8.23118 23.0991 8.20551 23.2232 8.26601 23.318C8.3265 23.4128 8.45116 23.4383 8.54649 23.3782Z" fill="#91D7EC" />
                <path id="Vector_411" d="M9.26524 24.4887C9.35874 24.4285 9.38623 24.3045 9.32574 24.2097C9.26524 24.1149 9.14058 24.0893 9.04525 24.1495C8.94993 24.2097 8.92426 24.3337 8.98476 24.4285C9.04525 24.5233 9.16991 24.5489 9.26524 24.4887Z" fill="#91D7EC" />
                <path id="Vector_412" d="M1.57093 20.4623C1.68276 20.4769 1.78359 20.3984 1.79825 20.289C1.81292 20.1778 1.73409 20.0775 1.6241 20.0629C1.51227 20.0483 1.41144 20.1267 1.39678 20.2361C1.38211 20.3474 1.46094 20.4477 1.57093 20.4623Z" fill="#91D7EC" />
                <path id="Vector_413" d="M2.85414 20.6282C2.96046 20.661 3.07412 20.6009 3.10712 20.4933C3.14012 20.3857 3.07962 20.2744 2.97146 20.2416C2.86514 20.2088 2.75148 20.269 2.71848 20.3766C2.68548 20.4823 2.74598 20.5954 2.85414 20.6282Z" fill="#91D7EC" />
                <path id="Vector_414" d="M4.09374 20.9966C4.19457 21.0458 4.31556 21.0075 4.36506 20.9072C4.41456 20.8069 4.37606 20.6866 4.27523 20.6373C4.1744 20.5881 4.05341 20.6264 4.00391 20.7267C3.95442 20.827 3.99291 20.9474 4.09374 20.9966Z" fill="#91D7EC" />
                <path id="Vector_415" d="M5.2487 21.5729C5.33853 21.6385 5.46502 21.6203 5.53285 21.5309C5.59885 21.4416 5.58051 21.3157 5.49068 21.2483C5.40086 21.1826 5.27436 21.2008 5.20653 21.2902C5.14054 21.3796 5.15887 21.5054 5.2487 21.5729Z" fill="#91D7EC" />
                <path id="Vector_416" d="M6.58132 22.0579C6.50249 21.9777 6.37417 21.9777 6.29534 22.0542C6.21468 22.1327 6.21468 22.2603 6.29167 22.3387C6.36867 22.4171 6.49883 22.419 6.57765 22.3424C6.65832 22.264 6.65832 22.1363 6.58132 22.0579Z" fill="#91D7EC" />
                <path id="Vector_417" d="M7.52905 23.0225C7.46122 22.9332 7.33472 22.915 7.2449 22.9824C7.15507 23.0499 7.13674 23.1757 7.20456 23.2651C7.27239 23.3544 7.39889 23.3727 7.48871 23.3052C7.57854 23.2377 7.59688 23.1119 7.52905 23.0225Z" fill="#91D7EC" />
                <path id="Vector_418" d="M8.26586 24.3738C8.36119 24.3173 8.39419 24.1933 8.33552 24.0966C8.27869 24.0018 8.15403 23.969 8.05687 24.0273C7.96154 24.0839 7.92855 24.2079 7.98721 24.3045C8.04404 24.3993 8.1687 24.4322 8.26586 24.3738Z" fill="#91D7EC" />
                <path id="Vector_419" d="M8.94408 25.5099C9.03941 25.4534 9.07241 25.3294 9.01374 25.2327C8.95691 25.1379 8.83226 25.1051 8.7351 25.1634C8.63977 25.22 8.60677 25.344 8.66543 25.4406C8.72226 25.5355 8.84692 25.5683 8.94408 25.5099Z" fill="#91D7EC" />
                <path id="Vector_420" d="M1.84263 20.8233C1.86647 20.7139 1.79864 20.6063 1.68864 20.5826C1.57865 20.5589 1.47049 20.6264 1.44666 20.7358C1.42282 20.8452 1.49065 20.9528 1.60065 20.9765C1.71064 21.0002 1.8188 20.9327 1.84263 20.8233Z" fill="#91D7EC" />
                <path id="Vector_421" d="M3.12937 21.1388C3.17153 21.0349 3.1202 20.9182 3.01754 20.8762C2.91305 20.8343 2.79572 20.8853 2.75356 20.9875C2.71139 21.0914 2.76272 21.2081 2.86538 21.2501C2.96988 21.292 3.0872 21.2409 3.12937 21.1388Z" fill="#91D7EC" />
                <path id="Vector_422" d="M4.06592 21.7297C4.16125 21.788 4.28591 21.7589 4.34458 21.664C4.40324 21.5692 4.37391 21.4452 4.27858 21.3869C4.18325 21.3285 4.05859 21.3577 3.99993 21.4525C3.94127 21.5473 3.9706 21.6713 4.06592 21.7297Z" fill="#91D7EC" />
                <path id="Vector_423" d="M5.14965 22.1199C5.07632 22.2038 5.08548 22.3314 5.16981 22.4044C5.25414 22.4773 5.38247 22.4682 5.4558 22.3843C5.52913 22.3004 5.51996 22.1728 5.43563 22.0998C5.3513 22.0269 5.22298 22.036 5.14965 22.1199Z" fill="#91D7EC" />
                <path id="Vector_424" d="M6.45824 22.9879C6.38491 22.904 6.25658 22.8949 6.17225 22.9679C6.08793 23.0408 6.07876 23.1685 6.15209 23.2523C6.22542 23.3362 6.35374 23.3453 6.43807 23.2724C6.5224 23.1995 6.53157 23.0718 6.45824 22.9879Z" fill="#91D7EC" />
                <path id="Vector_425" d="M7.34026 24.0055C7.27793 23.9125 7.15144 23.8888 7.05795 23.9526C6.96445 24.0146 6.94062 24.1404 7.00478 24.2334C7.06711 24.3264 7.1936 24.3501 7.2871 24.2863C7.38059 24.2243 7.40443 24.0985 7.34026 24.0055Z" fill="#91D7EC" />
                <path id="Vector_426" d="M8.09546 25.1124C8.04046 25.0158 7.91764 24.9811 7.82047 25.034C7.72331 25.0887 7.68848 25.2109 7.74165 25.3075C7.79481 25.4042 7.91947 25.4388 8.01663 25.3859C8.11379 25.3312 8.14862 25.2091 8.09546 25.1124Z" fill="#91D7EC" />
                <path id="Vector_427" d="M8.66556 26.5402C8.76272 26.4855 8.79755 26.3634 8.74438 26.2667C8.68939 26.1701 8.56656 26.1354 8.4694 26.1883C8.37224 26.243 8.33741 26.3652 8.39057 26.4618C8.44557 26.5585 8.56839 26.5931 8.66556 26.5402Z" fill="#91D7EC" />
                <path id="Vector_428" d="M1.68305 21.5327C1.78937 21.5673 1.90303 21.509 1.93786 21.4014C1.97269 21.2956 1.91403 21.1826 1.80587 21.1479C1.69954 21.1133 1.58588 21.1716 1.55105 21.2792C1.51622 21.385 1.57488 21.498 1.68305 21.5327Z" fill="#91D7EC" />
                <path id="Vector_429" d="M2.91683 21.9229C3.01583 21.974 3.13865 21.9357 3.18998 21.8354C3.24131 21.7351 3.20282 21.6148 3.10199 21.5637C3.00116 21.5126 2.88017 21.5509 2.82884 21.6512C2.77751 21.7497 2.81601 21.8719 2.91683 21.9229Z" fill="#91D7EC" />
                <path id="Vector_430" d="M4.35414 22.4682C4.42013 22.3789 4.4018 22.253 4.31197 22.1856C4.22215 22.1199 4.09565 22.1382 4.02782 22.2275C3.96183 22.3169 3.98016 22.4427 4.06999 22.5102C4.15982 22.5758 4.28631 22.5576 4.35414 22.4682Z" fill="#91D7EC" />
                <path id="Vector_431" d="M5.40077 23.2779C5.4796 23.1994 5.4796 23.0718 5.40077 22.9934C5.32194 22.915 5.19361 22.915 5.11479 22.9934C5.03596 23.0718 5.03596 23.1994 5.11479 23.2779C5.19361 23.3563 5.32194 23.3563 5.40077 23.2779Z" fill="#91D7EC" />
                <path id="Vector_432" d="M6.35382 23.949C6.28599 23.8614 6.15766 23.845 6.06967 23.9125C5.98168 23.98 5.96518 24.1076 6.03301 24.1951C6.10083 24.2827 6.22916 24.2991 6.31716 24.2316C6.40515 24.1641 6.42165 24.0365 6.35382 23.949Z" fill="#91D7EC" />
                <path id="Vector_433" d="M6.89469 24.9483C6.79936 25.0066 6.77186 25.1325 6.83053 25.2255C6.88919 25.3185 7.01568 25.3476 7.10918 25.2893C7.20267 25.2309 7.232 25.1051 7.17334 25.0121C7.11468 24.9191 6.98818 24.8899 6.89469 24.9483Z" fill="#91D7EC" />
                <path id="Vector_434" d="M7.80423 26.4162C7.90322 26.3633 7.93989 26.2411 7.88673 26.1427C7.83356 26.0442 7.71074 26.0077 7.61174 26.0606C7.51275 26.1135 7.47608 26.2357 7.52925 26.3341C7.58241 26.4326 7.70524 26.4691 7.80423 26.4162Z" fill="#91D7EC" />
                <path id="Vector_435" d="M8.42923 27.5815C8.52822 27.5286 8.56489 27.4064 8.51173 27.308C8.45856 27.2095 8.33574 27.173 8.23674 27.2259C8.13775 27.2788 8.10108 27.401 8.15425 27.4994C8.20741 27.5979 8.33024 27.6344 8.42923 27.5815Z" fill="#91D7EC" />
                <path id="Vector_436" d="M1.80191 22.1491C1.90457 22.1928 2.02373 22.1454 2.06773 22.0433C2.11173 21.9412 2.06406 21.8226 1.9614 21.7789C1.85874 21.7351 1.73958 21.7825 1.69559 21.8846C1.65159 21.9868 1.69925 22.1053 1.80191 22.1491Z" fill="#91D7EC" />
                <path id="Vector_437" d="M3.21343 22.3132C3.1181 22.253 2.99344 22.2804 2.93294 22.3752C2.87245 22.4682 2.89995 22.594 2.99527 22.6542C3.0906 22.7144 3.21526 22.687 3.27576 22.5922C3.33625 22.4974 3.30876 22.3734 3.21343 22.3132Z" fill="#91D7EC" />
                <path id="Vector_438" d="M4.37615 23.3253C4.44948 23.2414 4.44214 23.1137 4.35781 23.0408C4.27349 22.9679 4.14516 22.9752 4.07183 23.059C3.9985 23.1429 4.00584 23.2706 4.09016 23.3435C4.17449 23.4165 4.30282 23.4092 4.37615 23.3253Z" fill="#91D7EC" />
                <path id="Vector_439" d="M5.06908 24.1969C5.14241 24.2808 5.27074 24.2899 5.35506 24.217C5.43939 24.144 5.44856 24.0164 5.37523 23.9325C5.3019 23.8486 5.17357 23.8395 5.08925 23.9124C5.00492 23.9854 4.99575 24.113 5.06908 24.1969Z" fill="#91D7EC" />
                <path id="Vector_440" d="M6.26064 24.9428C6.19648 24.8516 6.06998 24.8297 5.97832 24.8935C5.88666 24.9574 5.86466 25.0832 5.92883 25.1744C5.99299 25.2655 6.11948 25.2874 6.21114 25.2236C6.3028 25.1598 6.3248 25.034 6.26064 24.9428Z" fill="#91D7EC" />
                <path id="Vector_441" d="M6.95894 26.3141C7.0561 26.2576 7.08727 26.1336 7.03044 26.0387C6.97361 25.9421 6.84895 25.9111 6.75362 25.9676C6.65646 26.0242 6.6253 26.1482 6.68213 26.243C6.73896 26.3378 6.86361 26.3706 6.95894 26.3141Z" fill="#91D7EC" />
                <path id="Vector_442" d="M7.70676 27.1858C7.65542 27.0873 7.5326 27.049 7.4336 27.1001C7.33461 27.1511 7.29611 27.2733 7.34744 27.3718C7.39877 27.4703 7.5216 27.5086 7.62059 27.4575C7.71959 27.4064 7.75809 27.2843 7.70676 27.1858Z" fill="#91D7EC" />
                <path id="Vector_443" d="M8.32297 28.3565C8.27164 28.258 8.14881 28.2197 8.04982 28.2708C7.95082 28.3218 7.91232 28.444 7.96365 28.5425C8.01498 28.641 8.13781 28.6793 8.2368 28.6282C8.3358 28.5771 8.3743 28.455 8.32297 28.3565Z" fill="#91D7EC" />
                <path id="Vector_444" d="M2.13571 22.4773C2.03672 22.4244 1.91389 22.4591 1.86073 22.5575C1.80756 22.656 1.8424 22.7782 1.94139 22.8311C2.04038 22.884 2.16321 22.8493 2.21637 22.7508C2.26954 22.6524 2.23471 22.5302 2.13571 22.4773Z" fill="#91D7EC" />
                <path id="Vector_445" d="M3.04326 23.1648C2.97543 23.2524 2.99193 23.38 3.07992 23.4475C3.16792 23.515 3.29624 23.4986 3.36407 23.411C3.4319 23.3235 3.4154 23.1958 3.32741 23.1284C3.23941 23.0609 3.11109 23.0773 3.04326 23.1648Z" fill="#91D7EC" />
                <path id="Vector_446" d="M4.3981 24.2353C4.47876 24.1569 4.47876 24.0292 4.39993 23.9508C4.3211 23.8706 4.19278 23.8706 4.11395 23.949C4.03329 24.0274 4.03329 24.155 4.11212 24.2334C4.19095 24.3137 4.31927 24.3137 4.3981 24.2353Z" fill="#91D7EC" />
                <path id="Vector_447" d="M5.31081 25.1926C5.39881 25.1233 5.41531 24.9975 5.34564 24.91C5.27598 24.8224 5.14949 24.806 5.06149 24.8753C4.9735 24.9446 4.957 25.0704 5.02666 25.158C5.09449 25.2455 5.22282 25.2619 5.31081 25.1926Z" fill="#91D7EC" />
                <path id="Vector_448" d="M6.17245 25.9676C6.11195 25.8746 5.98546 25.8473 5.89196 25.9075C5.79847 25.9676 5.77097 26.0935 5.83147 26.1865C5.89196 26.2795 6.01846 26.3068 6.11195 26.2467C6.20544 26.1865 6.23294 26.0606 6.17245 25.9676Z" fill="#91D7EC" />
                <path id="Vector_449" d="M6.89847 27.0873C6.84347 26.9906 6.71881 26.956 6.62165 27.0107C6.52449 27.0654 6.48966 27.1894 6.54466 27.2861C6.59966 27.3827 6.72431 27.4174 6.82148 27.3627C6.91864 27.308 6.95347 27.1839 6.89847 27.0873Z" fill="#91D7EC" />
                <path id="Vector_450" d="M7.55672 28.2416C7.50356 28.1431 7.38256 28.1049 7.28357 28.1577C7.18458 28.2106 7.14608 28.331 7.19924 28.4294C7.25241 28.5279 7.3734 28.5662 7.47239 28.5133C7.57139 28.4604 7.60988 28.3401 7.55672 28.2416Z" fill="#91D7EC" />
                <path id="Vector_451" d="M8.17635 29.4106C8.12319 29.3121 8.00219 29.2738 7.9032 29.3267C7.8042 29.3796 7.76571 29.4999 7.81887 29.5984C7.87203 29.6969 7.99303 29.7352 8.09202 29.6823C8.19102 29.6294 8.22951 29.509 8.17635 29.4106Z" fill="#91D7EC" />
                <path id="Vector_452" d="M2.02195 23.3125C1.95962 23.4055 1.98345 23.5295 2.07694 23.5915C2.17044 23.6535 2.2951 23.6298 2.35743 23.5368C2.41976 23.4438 2.39592 23.3198 2.30243 23.2578C2.20894 23.1958 2.08428 23.2195 2.02195 23.3125Z" fill="#91D7EC" />
                <path id="Vector_453" d="M3.14012 24.0274C3.06496 24.1094 3.07045 24.2371 3.15478 24.3118C3.23911 24.3866 3.3656 24.3811 3.44077 24.2972C3.51593 24.2152 3.51043 24.0875 3.4261 24.0128C3.34361 23.938 3.21528 23.9435 3.14012 24.0274Z" fill="#91D7EC" />
                <path id="Vector_454" d="M4.42748 24.9172C4.35415 24.8334 4.22582 24.8242 4.14149 24.8972C4.05716 24.9701 4.048 25.0978 4.12133 25.1817C4.19466 25.2655 4.32298 25.2747 4.40731 25.2017C4.49164 25.1288 4.5008 25.0011 4.42748 24.9172Z" fill="#91D7EC" />
                <path id="Vector_455" d="M4.97712 26.1646C5.04128 26.2558 5.16777 26.2777 5.25943 26.212C5.35109 26.1482 5.37309 26.0224 5.3071 25.9312C5.24293 25.84 5.11644 25.8181 5.02478 25.8838C4.93312 25.9476 4.91112 26.0734 4.97712 26.1646Z" fill="#91D7EC" />
                <path id="Vector_456" d="M5.8057 26.9542C5.71037 27.0126 5.68104 27.1366 5.73787 27.2314C5.7947 27.3262 5.92119 27.3554 6.01652 27.2989C6.11184 27.2405 6.14118 27.1165 6.08435 27.0217C6.02568 26.9269 5.90102 26.8977 5.8057 26.9542Z" fill="#91D7EC" />
                <path id="Vector_457" d="M6.77945 28.1541C6.72445 28.0574 6.60163 28.0228 6.50447 28.0775C6.40731 28.1322 6.37247 28.2544 6.42747 28.351C6.48247 28.4477 6.60529 28.4823 6.70245 28.4276C6.79962 28.3729 6.83445 28.2507 6.77945 28.1541Z" fill="#91D7EC" />
                <path id="Vector_458" d="M7.43024 29.3084C7.37708 29.2099 7.25242 29.1753 7.15526 29.2282C7.05626 29.281 7.02143 29.405 7.0746 29.5017C7.12776 29.6002 7.25242 29.6348 7.34958 29.5819C7.44857 29.529 7.4834 29.405 7.43024 29.3084Z" fill="#91D7EC" />
                <path id="Vector_459" d="M8.06794 30.4646C8.01477 30.3661 7.89011 30.3315 7.79295 30.3843C7.69396 30.4372 7.65913 30.5612 7.71229 30.6579C7.76545 30.7563 7.89011 30.791 7.98727 30.7381C8.08627 30.6852 8.1211 30.5612 8.06794 30.4646Z" fill="#91D7EC" />
                <path id="Vector_460" d="M2.15567 24.1532C2.08601 24.2389 2.09884 24.3665 2.18501 24.4358C2.27117 24.5051 2.39949 24.4924 2.46916 24.4067C2.53882 24.321 2.52599 24.1933 2.43983 24.124C2.35366 24.0547 2.22534 24.0675 2.15567 24.1532Z" fill="#91D7EC" />
                <path id="Vector_461" d="M3.20616 24.9646C3.1255 25.0412 3.12183 25.1689 3.20066 25.2491C3.27766 25.3294 3.40598 25.333 3.48665 25.2546C3.56731 25.1762 3.57097 25.0504 3.49215 24.9701C3.41515 24.8899 3.28682 24.8862 3.20616 24.9646Z" fill="#91D7EC" />
                <path id="Vector_462" d="M4.42523 25.9385C4.35741 25.8509 4.22908 25.8345 4.14108 25.9038C4.05309 25.9713 4.03659 26.0989 4.10625 26.1865C4.17408 26.274 4.30241 26.2904 4.3904 26.2211C4.4784 26.1536 4.4949 26.026 4.42523 25.9385Z" fill="#91D7EC" />
                <path id="Vector_463" d="M4.91102 27.2186C4.97335 27.3116 5.09801 27.3371 5.1915 27.2751C5.285 27.2131 5.31066 27.0891 5.24833 26.9961C5.186 26.9031 5.06135 26.8776 4.96785 26.9396C4.87436 27.0016 4.84869 27.1256 4.91102 27.2186Z" fill="#91D7EC" />
                <path id="Vector_464" d="M5.98738 28.1049C5.93055 28.01 5.80589 27.9772 5.70873 28.0356C5.6134 28.0921 5.5804 28.2161 5.63907 28.3128C5.6959 28.4076 5.82055 28.4404 5.91772 28.3821C6.01488 28.3237 6.04604 28.2015 5.98738 28.1049Z" fill="#91D7EC" />
                <path id="Vector_465" d="M6.67102 29.241C6.61602 29.1443 6.49136 29.1115 6.3942 29.1662C6.29704 29.2209 6.26404 29.3449 6.31904 29.4415C6.37403 29.5382 6.49869 29.571 6.59585 29.5163C6.69302 29.4616 6.72601 29.3376 6.67102 29.241Z" fill="#91D7EC" />
                <path id="Vector_466" d="M7.3313 30.3843C7.27447 30.2877 7.14981 30.2567 7.05448 30.3132C6.95915 30.3697 6.92615 30.4937 6.98298 30.5886C7.03981 30.6852 7.16447 30.7162 7.2598 30.6597C7.35513 30.6032 7.38813 30.4791 7.3313 30.3843Z" fill="#91D7EC" />
                <path id="Vector_467" d="M7.65535 31.7283C7.71218 31.8249 7.83684 31.8559 7.93216 31.7994C8.02933 31.7429 8.06049 31.6189 8.00366 31.524C7.94683 31.4292 7.82217 31.3964 7.72684 31.4529C7.63152 31.5095 7.59852 31.6335 7.65535 31.7283Z" fill="#91D7EC" />
                <path id="Vector_468" d="M2.24547 25.0868C2.16847 25.1671 2.17214 25.2947 2.2528 25.3713C2.33346 25.4479 2.46179 25.4442 2.53878 25.364C2.61578 25.2838 2.61211 25.1561 2.53145 25.0795C2.45079 25.0029 2.32246 25.0066 2.24547 25.0868Z" fill="#91D7EC" />
                <path id="Vector_469" d="M3.51234 26.0023C3.43901 25.9184 3.31251 25.9075 3.22635 25.9786C3.14202 26.0515 3.13102 26.1773 3.20252 26.2631C3.27585 26.3469 3.40234 26.3579 3.4885 26.2868C3.57466 26.2156 3.58383 26.088 3.51234 26.0023Z" fill="#91D7EC" />
                <path id="Vector_470" d="M4.38499 27.0198C4.319 26.9287 4.1925 26.9086 4.10268 26.9742C4.01102 27.0399 3.99085 27.1657 4.05685 27.2551C4.12284 27.3463 4.24933 27.3663 4.33916 27.3007C4.43082 27.235 4.45099 27.1092 4.38499 27.0198Z" fill="#91D7EC" />
                <path id="Vector_471" d="M4.82328 28.32C4.88378 28.413 5.00844 28.4404 5.10377 28.382C5.19726 28.3218 5.22476 28.1978 5.1661 28.103C5.1056 28.01 4.98094 27.9827 4.88561 28.041C4.79212 28.1012 4.76462 28.2252 4.82328 28.32Z" fill="#91D7EC" />
                <path id="Vector_472" d="M5.88106 29.2191C5.8224 29.1243 5.69774 29.0933 5.60241 29.1516C5.50708 29.21 5.47592 29.334 5.53458 29.4288C5.59324 29.5236 5.7179 29.5546 5.81323 29.4963C5.90856 29.4379 5.93972 29.3139 5.88106 29.2191Z" fill="#91D7EC" />
                <path id="Vector_473" d="M6.56856 30.3479C6.5099 30.253 6.38524 30.222 6.28991 30.2804C6.19458 30.3387 6.16342 30.4628 6.22208 30.5576C6.28074 30.6524 6.4054 30.6834 6.50073 30.625C6.59606 30.5667 6.62722 30.4427 6.56856 30.3479Z" fill="#91D7EC" />
                <path id="Vector_474" d="M7.25596 31.473C7.19546 31.38 7.06897 31.3526 6.97547 31.4146C6.88198 31.4748 6.85448 31.6006 6.91681 31.6936C6.97731 31.7866 7.1038 31.814 7.19729 31.752C7.29079 31.6918 7.31829 31.566 7.25596 31.473Z" fill="#91D7EC" />
                <path id="Vector_475" d="M7.92141 32.8571C8.01491 32.7969 8.04241 32.6711 7.98008 32.5781C7.91958 32.4851 7.79309 32.4577 7.69959 32.5197C7.6061 32.5799 7.5786 32.7057 7.64093 32.7987C7.70143 32.8917 7.82792 32.9191 7.92141 32.8571Z" fill="#91D7EC" />
                <path id="Vector_476" d="M2.55532 26.13C2.47833 26.0479 2.35 26.0443 2.26934 26.119C2.18684 26.1956 2.18318 26.3233 2.25834 26.4035C2.33534 26.4856 2.46366 26.4892 2.54432 26.4144C2.62682 26.3378 2.63048 26.2102 2.55532 26.13Z" fill="#91D7EC" />
                <path id="Vector_477" d="M3.47211 27.111C3.40245 27.0235 3.27595 27.0071 3.18796 27.0764C3.09996 27.1457 3.08347 27.2715 3.15313 27.359C3.22279 27.4465 3.34928 27.463 3.43728 27.3937C3.52527 27.3244 3.54177 27.1985 3.47211 27.111Z" fill="#91D7EC" />
                <path id="Vector_478" d="M4.29356 28.1632C4.2294 28.072 4.10474 28.0483 4.01124 28.1103C3.91958 28.1741 3.89575 28.2981 3.95808 28.3911C4.02224 28.4823 4.1469 28.506 4.2404 28.444C4.33389 28.382 4.35589 28.2562 4.29356 28.1632Z" fill="#91D7EC" />
                <path id="Vector_479" d="M4.98841 29.5364C5.08191 29.4762 5.10941 29.3522 5.04891 29.2573C4.98842 29.1625 4.86376 29.137 4.76843 29.1972C4.67493 29.2573 4.64743 29.3814 4.70793 29.4762C4.76843 29.5692 4.89309 29.5965 4.98841 29.5364Z" fill="#91D7EC" />
                <path id="Vector_480" d="M5.7655 30.3697C5.70501 30.2749 5.58035 30.2475 5.48502 30.3077C5.38969 30.3679 5.36219 30.4919 5.42269 30.5867C5.48319 30.6815 5.60785 30.7089 5.70317 30.6487C5.7985 30.5885 5.826 30.4645 5.7655 30.3697Z" fill="#91D7EC" />
                <path id="Vector_481" d="M6.41815 31.7611C6.51165 31.6991 6.53548 31.5733 6.47315 31.4821C6.41082 31.3909 6.28433 31.3654 6.19267 31.4274C6.09917 31.4894 6.07534 31.6152 6.13767 31.7064C6.2 31.7994 6.32649 31.8231 6.41815 31.7611Z" fill="#91D7EC" />
                <path id="Vector_482" d="M6.92399 32.5307C6.83416 32.5963 6.81583 32.724 6.88183 32.8133C6.94782 32.9027 7.07615 32.9209 7.16598 32.8553C7.25581 32.7896 7.27414 32.662 7.20814 32.5726C7.14215 32.4833 7.01382 32.465 6.92399 32.5307Z" fill="#91D7EC" />
                <path id="Vector_483" d="M7.95797 33.9148C8.0478 33.8491 8.06613 33.7215 8.00013 33.6321C7.93414 33.5428 7.80581 33.5245 7.71598 33.5902C7.62616 33.6558 7.60782 33.7835 7.67382 33.8728C7.73982 33.9622 7.86814 33.9804 7.95797 33.9148Z" fill="#91D7EC" />
                <path id="Vector_484" d="M2.49514 27.2879C2.42364 27.2022 2.29532 27.1912 2.20916 27.2642C2.12299 27.3353 2.11199 27.4629 2.18532 27.5486C2.25682 27.6344 2.38514 27.6453 2.47131 27.5724C2.55747 27.5012 2.56847 27.3736 2.49514 27.2879Z" fill="#91D7EC" />
                <path id="Vector_485" d="M3.36035 28.3091C3.29435 28.2198 3.16786 28.1997 3.0762 28.2672C2.98453 28.3346 2.9662 28.4586 3.03403 28.5498C3.10186 28.641 3.22652 28.6592 3.31818 28.5918C3.40801 28.5261 3.42818 28.4003 3.36035 28.3091Z" fill="#91D7EC" />
                <path id="Vector_486" d="M4.15245 29.3777C4.09012 29.2865 3.96362 29.2628 3.87013 29.3248C3.77847 29.3868 3.75464 29.5127 3.81697 29.6057C3.8793 29.6987 4.00579 29.7206 4.09928 29.6586C4.19094 29.5966 4.21478 29.4707 4.15245 29.3777Z" fill="#91D7EC" />
                <path id="Vector_487" d="M4.90186 30.47C4.83953 30.377 4.71304 30.3533 4.62138 30.4153C4.52788 30.4773 4.50405 30.6031 4.56638 30.6943C4.62871 30.7873 4.7552 30.811 4.84686 30.7509C4.94036 30.6889 4.96419 30.563 4.90186 30.4719V30.47Z" fill="#91D7EC" />
                <path id="Vector_488" d="M5.63736 31.566C5.5732 31.4748 5.4467 31.4511 5.35504 31.5149C5.26338 31.5788 5.23955 31.7046 5.30371 31.7958C5.36787 31.887 5.49437 31.9107 5.58603 31.8468C5.67769 31.783 5.70152 31.6572 5.63736 31.566Z" fill="#91D7EC" />
                <path id="Vector_489" d="M6.39068 32.6437C6.32285 32.5543 6.19636 32.5379 6.10653 32.6054C6.0167 32.6729 6.0002 32.7987 6.06803 32.8881C6.13586 32.9774 6.26235 32.9938 6.35218 32.9264C6.44201 32.8589 6.45851 32.7331 6.39068 32.6437Z" fill="#91D7EC" />
                <path id="Vector_490" d="M7.16415 33.9713C7.24847 33.8983 7.25764 33.7707 7.18431 33.6868C7.11098 33.6029 6.98266 33.5938 6.89833 33.6667C6.814 33.7397 6.80483 33.8673 6.87816 33.9512C6.95149 34.0351 7.07982 34.0442 7.16415 33.9713Z" fill="#91D7EC" />
                <path id="Vector_491" d="M8.03524 34.9652C8.11957 34.8922 8.12873 34.7646 8.05541 34.6807C7.98208 34.5968 7.85375 34.5877 7.76942 34.6606C7.68509 34.7336 7.67593 34.8612 7.74926 34.9451C7.82259 35.029 7.95091 35.0381 8.03524 34.9652Z" fill="#91D7EC" />
                <path id="Vector_492" d="M2.30997 28.8525C2.39797 28.7832 2.41263 28.6556 2.34297 28.5698C2.27331 28.4823 2.14498 28.4677 2.05882 28.537C1.97266 28.6063 1.95616 28.734 2.02582 28.8197C2.09549 28.9072 2.22381 28.9218 2.30997 28.8525Z" fill="#91D7EC" />
                <path id="Vector_493" d="M3.12932 29.892C3.21914 29.8263 3.23931 29.7005 3.17331 29.6111C3.10732 29.5218 2.98083 29.5017 2.891 29.5674C2.80117 29.633 2.781 29.7588 2.847 29.8482C2.913 29.9376 3.03949 29.9576 3.12932 29.892Z" fill="#91D7EC" />
                <path id="Vector_494" d="M3.91049 30.9587C4.00215 30.8949 4.02232 30.7691 3.95815 30.6779C3.89399 30.5867 3.7675 30.5667 3.67584 30.6305C3.58418 30.6943 3.56401 30.8201 3.62817 30.9113C3.69234 31.0025 3.81883 31.0225 3.91049 30.9587Z" fill="#91D7EC" />
                <path id="Vector_495" d="M4.44178 31.7101C4.35195 31.7757 4.33179 31.9015 4.39778 31.9909C4.46378 32.0803 4.59027 32.1003 4.6801 32.0347C4.76993 31.969 4.79009 31.8432 4.7241 31.7538C4.6581 31.6645 4.53161 31.6444 4.44178 31.7101Z" fill="#91D7EC" />
                <path id="Vector_496" d="M5.50321 32.8151C5.43354 32.7276 5.30705 32.713 5.21906 32.7823C5.13106 32.8516 5.1164 32.9774 5.18606 33.065C5.25572 33.1525 5.38221 33.1671 5.47021 33.0978C5.5582 33.0285 5.57287 32.9027 5.50321 32.8151Z" fill="#91D7EC" />
                <path id="Vector_497" d="M6.31897 33.8418C6.24381 33.758 6.11549 33.7525 6.03299 33.8254C5.94866 33.9002 5.94316 34.0278 6.01649 34.1099C6.09165 34.1938 6.21998 34.1993 6.30248 34.1263C6.3868 34.0515 6.3923 33.9239 6.31897 33.8418Z" fill="#91D7EC" />
                <path id="Vector_498" d="M7.19894 35.1001C7.27594 35.0198 7.27227 34.8922 7.19161 34.8156C7.11095 34.739 6.98262 34.7427 6.90562 34.8229C6.82863 34.9031 6.8323 35.0308 6.91296 35.1074C6.99362 35.184 7.12195 35.1803 7.19894 35.1001Z" fill="#91D7EC" />
                <path id="Vector_499" d="M7.86656 35.7328C7.78957 35.8131 7.79323 35.9407 7.8739 36.0173C7.95456 36.0939 8.08288 36.0902 8.15988 36.01C8.23687 35.9298 8.23321 35.8021 8.15255 35.7255C8.07188 35.6489 7.94356 35.6526 7.86656 35.7328Z" fill="#91D7EC" />
                <path id="Vector_500" d="M2.05126 30.2859C2.13926 30.2166 2.15392 30.0907 2.08426 30.0032C2.0146 29.9157 1.88811 29.9011 1.80011 29.9704C1.71212 30.0397 1.69745 30.1655 1.76711 30.253C1.83678 30.3406 1.96327 30.3551 2.05126 30.2859Z" fill="#91D7EC" />
                <path id="Vector_501" d="M2.90923 31.0445C2.8414 30.9551 2.71491 30.9387 2.62508 31.0062C2.53526 31.0736 2.51876 31.1995 2.58659 31.2888C2.65442 31.3782 2.78091 31.3946 2.87074 31.3271C2.96056 31.2596 2.97706 31.1338 2.90923 31.0445Z" fill="#91D7EC" />
                <path id="Vector_502" d="M3.7143 32.093C3.64463 32.0055 3.51814 31.9891 3.43015 32.0584C3.34215 32.1277 3.32565 32.2535 3.39532 32.341C3.46498 32.4285 3.59147 32.445 3.67947 32.3757C3.76746 32.3064 3.78396 32.1805 3.7143 32.093Z" fill="#91D7EC" />
                <path id="Vector_503" d="M4.23828 33.1032C4.15212 33.1744 4.14112 33.302 4.21261 33.3877C4.28411 33.4734 4.41244 33.4844 4.4986 33.4132C4.58476 33.3421 4.59576 33.2145 4.52426 33.1288C4.45277 33.0431 4.32444 33.0321 4.23828 33.1032Z" fill="#91D7EC" />
                <path id="Vector_504" d="M5.08353 34.1244C5.00104 34.201 4.99737 34.3287 5.07437 34.4089C5.15136 34.4892 5.27969 34.4946 5.36035 34.418C5.44101 34.3415 5.44651 34.2138 5.36952 34.1336C5.29252 34.0533 5.16419 34.0479 5.08353 34.1244Z" fill="#91D7EC" />
                <path id="Vector_505" d="M6.2676 35.0836C6.1851 35.0089 6.05678 35.0143 5.98162 35.0964C5.90645 35.1785 5.91195 35.3061 5.99445 35.3809C6.07694 35.4556 6.20527 35.4502 6.28043 35.3681C6.35559 35.286 6.35009 35.1584 6.2676 35.0836Z" fill="#91D7EC" />
                <path id="Vector_506" d="M7.27251 36.2471C7.34034 36.1577 7.32385 36.0319 7.23402 35.9644C7.14419 35.8969 7.0177 35.9134 6.94987 36.0027C6.88204 36.0921 6.89854 36.2179 6.98836 36.2854C7.07819 36.3528 7.20469 36.3364 7.27251 36.2471Z" fill="#91D7EC" />
                <path id="Vector_507" d="M8.00553 36.8033C7.9377 36.8927 7.9542 37.0185 8.04403 37.086C8.13386 37.1534 8.26035 37.137 8.32818 37.0477C8.39601 36.9583 8.37951 36.8325 8.28968 36.765C8.19985 36.6975 8.07336 36.714 8.00553 36.8033Z" fill="#91D7EC" />
                <path id="Vector_508" d="M1.69733 31.9234C1.78349 31.8523 1.79449 31.7247 1.72299 31.639C1.6515 31.5533 1.52317 31.5423 1.43701 31.6134C1.35085 31.6845 1.33985 31.8122 1.41134 31.8979C1.48284 31.9836 1.61117 31.9946 1.69733 31.9234Z" fill="#91D7EC" />
                <path id="Vector_509" d="M2.57202 32.6529C2.49869 32.569 2.3722 32.558 2.28604 32.6292C2.19988 32.7021 2.19071 32.8279 2.26221 32.9136C2.33554 32.9993 2.46203 33.0085 2.54819 32.9373C2.63252 32.8644 2.64352 32.7386 2.57202 32.6529Z" fill="#91D7EC" />
                <path id="Vector_510" d="M3.14044 33.6394C3.05795 33.7142 3.05245 33.8418 3.12761 33.9239C3.20277 34.006 3.3311 34.0114 3.4136 33.9367C3.49609 33.8619 3.50159 33.7342 3.42643 33.6522C3.35127 33.5701 3.22294 33.5647 3.14044 33.6394Z" fill="#91D7EC" />
                <path id="Vector_511" d="M4.31343 34.6205C4.23277 34.5421 4.10445 34.5439 4.02745 34.6223C3.94862 34.7025 3.95046 34.8302 4.02928 34.9068C4.10995 34.9852 4.23827 34.9834 4.31527 34.9049C4.3941 34.8247 4.39226 34.6971 4.31343 34.6205Z" fill="#91D7EC" />
                <path id="Vector_512" d="M4.9865 35.8441C5.07266 35.917 5.19915 35.9061 5.27248 35.8204C5.34581 35.7347 5.33481 35.6088 5.24865 35.5359C5.16249 35.463 5.036 35.4739 4.96267 35.5596C4.88934 35.6453 4.90034 35.7711 4.9865 35.8441Z" fill="#91D7EC" />
                <path id="Vector_513" d="M5.96509 36.4295C5.90093 36.5207 5.92109 36.6465 6.01275 36.7103C6.10441 36.7741 6.23091 36.7541 6.29507 36.6629C6.35923 36.5717 6.33907 36.4459 6.24741 36.3821C6.15574 36.3182 6.02925 36.3383 5.96509 36.4295Z" fill="#91D7EC" />
                <path id="Vector_514" d="M7.11132 37.4871C7.20848 37.5436 7.33131 37.509 7.38814 37.4123C7.44497 37.3157 7.41014 37.1935 7.31298 37.137C7.21582 37.0804 7.09299 37.1151 7.03616 37.2117C6.97933 37.3084 7.01416 37.4306 7.11132 37.4871Z" fill="#91D7EC" />
                <path id="Vector_515" d="M8.46386 37.7953C8.3667 37.7388 8.24387 37.7734 8.18704 37.8701C8.13021 37.9667 8.16504 38.0889 8.2622 38.1454C8.35936 38.2019 8.48219 38.1673 8.53902 38.0707C8.59585 37.974 8.56102 37.8518 8.46386 37.7953Z" fill="#91D7EC" />
                <path id="Vector_516" d="M1.25951 33.5555C1.18251 33.4752 1.05419 33.4734 0.973524 33.55C0.892862 33.6266 0.891029 33.7542 0.968025 33.8345C1.04502 33.9147 1.17335 33.9165 1.25401 33.84C1.33467 33.7634 1.3365 33.6357 1.25951 33.5555Z" fill="#91D7EC" />
                <path id="Vector_517" d="M1.8899 34.5074C1.8129 34.5876 1.81474 34.7153 1.8954 34.7919C1.97606 34.8684 2.10439 34.8666 2.18138 34.7864C2.25838 34.7061 2.25654 34.5785 2.17588 34.5019C2.09522 34.4253 1.9669 34.4271 1.8899 34.5074Z" fill="#91D7EC" />
                <path id="Vector_518" d="M2.83617 35.432C2.76284 35.5158 2.77201 35.6435 2.85634 35.7164C2.94066 35.7894 3.06899 35.7803 3.14232 35.6964C3.21565 35.6125 3.20648 35.4848 3.12215 35.4119C3.03783 35.339 2.9095 35.3481 2.83617 35.432Z" fill="#91D7EC" />
                <path id="Vector_519" d="M4.15795 36.548C4.22578 36.4586 4.20745 36.3328 4.11762 36.2653C4.02779 36.1979 3.9013 36.2161 3.83347 36.3054C3.76564 36.3948 3.78397 36.5206 3.8738 36.5881C3.96363 36.6556 4.09012 36.6373 4.15795 36.548Z" fill="#91D7EC" />
                <path id="Vector_520" d="M4.95133 37.3887C5.04666 37.447 5.17132 37.4197 5.22998 37.3248C5.28864 37.23 5.26114 37.106 5.16582 37.0476C5.07049 36.9893 4.94583 37.0166 4.88717 37.1115C4.8285 37.2063 4.856 37.3303 4.95133 37.3887Z" fill="#91D7EC" />
                <path id="Vector_521" d="M6.36298 38.0105C6.41431 37.912 6.37398 37.7898 6.27499 37.7388C6.17599 37.6877 6.05317 37.7278 6.00184 37.8263C5.95051 37.9248 5.99084 38.047 6.08983 38.098C6.18883 38.1491 6.31165 38.109 6.36298 38.0105Z" fill="#91D7EC" />
                <path id="Vector_522" d="M7.29053 38.7071C7.39502 38.7491 7.51235 38.698 7.55451 38.5941C7.59668 38.4901 7.54535 38.3734 7.44085 38.3315C7.33636 38.2895 7.21903 38.3406 7.17687 38.4445C7.13471 38.5485 7.18604 38.6652 7.29053 38.7071Z" fill="#91D7EC" />
                <path id="Vector_523" d="M8.67474 38.822C8.57025 38.7801 8.45292 38.8311 8.41076 38.9351C8.36859 39.039 8.41992 39.1557 8.52442 39.1977C8.62891 39.2396 8.74624 39.1885 8.7884 39.0846C8.83057 38.9806 8.77924 38.8639 8.67474 38.822Z" fill="#91D7EC" />
                <path id="Vector_524" d="M0.45098 35.9207C0.381317 36.0082 0.397816 36.1358 0.485811 36.2033C0.573806 36.2726 0.702132 36.2562 0.769961 36.1687C0.839624 36.0811 0.823125 35.9535 0.73513 35.886C0.647135 35.8185 0.518809 35.8331 0.45098 35.9207Z" fill="#91D7EC" />
                <path id="Vector_525" d="M1.49219 36.7413C1.42803 36.8325 1.45186 36.9583 1.54352 37.0221C1.63518 37.086 1.76167 37.0622 1.82584 36.9711C1.89 36.8799 1.86617 36.7541 1.7745 36.6902C1.68284 36.6264 1.55635 36.6501 1.49219 36.7413Z" fill="#91D7EC" />
                <path id="Vector_526" d="M2.57568 37.5054C2.51885 37.6002 2.55001 37.7242 2.64718 37.7826C2.74434 37.8409 2.86716 37.8081 2.92583 37.7114C2.98266 37.6166 2.95149 37.4926 2.85433 37.4343C2.75717 37.3759 2.63434 37.4087 2.57568 37.5054Z" fill="#91D7EC" />
                <path id="Vector_527" d="M3.80223 38.4628C3.90306 38.512 4.02405 38.4719 4.07355 38.3716C4.12304 38.2713 4.08271 38.1509 3.98188 38.1017C3.88106 38.0525 3.76006 38.0926 3.71057 38.1929C3.66107 38.2932 3.7014 38.4135 3.80223 38.4628Z" fill="#91D7EC" />
                <path id="Vector_528" d="M5.15668 38.6834C5.05218 38.6414 4.93486 38.6925 4.89269 38.7964C4.85053 38.9004 4.90186 39.0171 5.00635 39.059C5.11084 39.101 5.22817 39.0499 5.27034 38.946C5.3125 38.842 5.26117 38.7253 5.15668 38.6834Z" fill="#91D7EC" />
                <path id="Vector_529" d="M6.12132 39.2997C6.08832 39.4055 6.14882 39.5186 6.25515 39.5514C6.36147 39.5842 6.47513 39.524 6.50813 39.4183C6.54113 39.3125 6.48063 39.1994 6.37431 39.1666C6.26798 39.1338 6.15432 39.194 6.12132 39.2997Z" fill="#91D7EC" />
                <path id="Vector_530" d="M7.5401 39.9453C7.65009 39.969 7.75825 39.9016 7.78209 39.7921C7.80592 39.6827 7.73809 39.5751 7.6281 39.5514C7.5181 39.5277 7.40994 39.5952 7.38611 39.7046C7.36228 39.814 7.43011 39.9216 7.5401 39.9453Z" fill="#91D7EC" />
                <path id="Vector_531" d="M8.92399 39.8395C8.814 39.8158 8.70584 39.8833 8.68201 39.9927C8.65818 40.1021 8.72601 40.2097 8.836 40.2334C8.94599 40.2571 9.05415 40.1896 9.07799 40.0802C9.10182 39.9708 9.03399 39.8632 8.92399 39.8395Z" fill="#91D7EC" />
                <path id="Vector_532" d="M0.388531 39.1028C0.432529 39.0007 0.384865 38.8821 0.282204 38.8384C0.179543 38.7946 0.0603838 38.842 0.0163864 38.9441C-0.0276111 39.0463 0.0200528 39.1648 0.122713 39.2086C0.225374 39.2523 0.344534 39.2049 0.388531 39.1028Z" fill="#91D7EC" />
                <path id="Vector_533" d="M1.61334 39.6134C1.65184 39.5095 1.59684 39.3928 1.49235 39.3545C1.38785 39.3162 1.27053 39.3709 1.23203 39.4748C1.19353 39.5788 1.24853 39.6955 1.35302 39.7338C1.45752 39.7721 1.57484 39.7174 1.61334 39.6134Z" fill="#91D7EC" />
                <path id="Vector_534" d="M2.86543 40.0492C2.8966 39.9416 2.83427 39.8304 2.72794 39.7994C2.61978 39.7684 2.50795 39.8304 2.47679 39.9361C2.44562 40.0437 2.50795 40.155 2.61428 40.186C2.72244 40.217 2.83427 40.155 2.86543 40.0492Z" fill="#91D7EC" />
                <path id="Vector_535" d="M3.99089 40.1659C3.88089 40.1422 3.77273 40.2097 3.7489 40.3191C3.72507 40.4285 3.7929 40.5361 3.90289 40.5598C4.01289 40.5835 4.12105 40.5161 4.14488 40.4066C4.16871 40.2972 4.10088 40.1896 3.99089 40.1659Z" fill="#91D7EC" />
                <path id="Vector_536" d="M5.20998 40.8516C5.31998 40.8699 5.42447 40.7951 5.4428 40.6839C5.46114 40.5744 5.38597 40.4705 5.27415 40.4523C5.16415 40.434 5.05966 40.5088 5.04133 40.62C5.02299 40.7294 5.09816 40.8334 5.20998 40.8516Z" fill="#91D7EC" />
                <path id="Vector_537" d="M6.5739 40.6619C6.46207 40.651 6.36308 40.7312 6.35208 40.8425C6.34108 40.9537 6.42174 41.0522 6.53357 41.0631C6.64539 41.0741 6.74439 40.9938 6.75539 40.8826C6.76639 40.7714 6.68572 40.6729 6.5739 40.6619Z" fill="#91D7EC" />
                <path id="Vector_538" d="M7.88294 40.7914C7.77111 40.786 7.67579 40.8735 7.67212 40.9847C7.66662 41.096 7.75461 41.1908 7.86644 41.1944C7.97827 41.1999 8.0736 41.1124 8.07726 41.0012C8.08276 40.8899 7.99477 40.7951 7.88294 40.7914Z" fill="#91D7EC" />
                <path id="Vector_539" d="M8.99731 41.0412C8.99182 41.1525 9.07981 41.2473 9.19164 41.251C9.30346 41.2546 9.39879 41.1689 9.40246 41.0577C9.40612 40.9464 9.31996 40.8516 9.20814 40.848C9.09631 40.8443 9.00098 40.93 8.99731 41.0412Z" fill="#91D7EC" />
                <path id="Vector_540" d="M0.304176 42.6624C0.192349 42.666 0.104354 42.7591 0.108021 42.8703C0.111687 42.9815 0.205182 43.0691 0.317008 43.0654C0.428835 43.0618 0.51683 42.9688 0.513164 42.8575C0.509497 42.7463 0.416003 42.6588 0.304176 42.6624Z" fill="#91D7EC" />
                <path id="Vector_541" d="M1.8385 42.8083C1.833 42.6971 1.73767 42.6114 1.62584 42.6168C1.51402 42.6223 1.42786 42.7171 1.43335 42.8284C1.43885 42.9396 1.53418 43.0253 1.64601 43.0198C1.75784 43.0144 1.844 42.9195 1.8385 42.8083Z" fill="#91D7EC" />
                <path id="Vector_542" d="M2.94952 42.553C2.83769 42.5603 2.75337 42.6569 2.7607 42.7682C2.76803 42.8794 2.86519 42.9633 2.97702 42.956C3.08885 42.9487 3.17317 42.8521 3.16584 42.7408C3.15851 42.6296 3.06135 42.5457 2.94952 42.553Z" fill="#91D7EC" />
                <path id="Vector_543" d="M4.26935 42.4636C4.15752 42.4728 4.07503 42.5712 4.08419 42.6825C4.09336 42.7937 4.19235 42.8758 4.30418 42.8667C4.41601 42.8575 4.4985 42.7591 4.48933 42.6478C4.48017 42.5366 4.38117 42.4545 4.26935 42.4636Z" fill="#91D7EC" />
                <path id="Vector_544" d="M5.81139 42.5293C5.80039 42.418 5.69956 42.3378 5.58774 42.3506C5.47591 42.3615 5.39525 42.4618 5.40808 42.5731C5.42091 42.6843 5.51991 42.7645 5.63173 42.7518C5.74356 42.7408 5.82422 42.6405 5.81139 42.5293Z" fill="#91D7EC" />
                <path id="Vector_545" d="M7.13322 42.3853C7.11856 42.274 7.01773 42.1974 6.9059 42.2102C6.79407 42.2248 6.71708 42.3251 6.72991 42.4363C6.74274 42.5476 6.8454 42.6241 6.95723 42.6114C7.06906 42.5986 7.14605 42.4965 7.13322 42.3853Z" fill="#91D7EC" />
                <path id="Vector_546" d="M8.22008 42.0442C8.11009 42.0606 8.03309 42.1627 8.04959 42.2722C8.06609 42.3816 8.16875 42.4582 8.27874 42.4417C8.38874 42.4253 8.46573 42.3232 8.44923 42.2138C8.43273 42.1044 8.33007 42.0278 8.22008 42.0442Z" fill="#91D7EC" />
                <path id="Vector_547" d="M9.76369 42.0223C9.74719 41.9129 9.64453 41.8363 9.53453 41.8527C9.42454 41.8692 9.34754 41.9713 9.36404 42.0807C9.38054 42.1901 9.4832 42.2667 9.5932 42.2503C9.70319 42.2339 9.78019 42.1317 9.76369 42.0223Z" fill="#91D7EC" />
                <path id="Vector_548" d="M1.7176 47.2487C1.63328 47.3216 1.62594 47.4493 1.69927 47.5332C1.7726 47.6171 1.90093 47.6243 1.98526 47.5514C2.06958 47.4785 2.07692 47.3508 2.00359 47.2669C1.93026 47.183 1.80193 47.1757 1.7176 47.2487Z" fill="#91D7EC" />
                <path id="Vector_549" d="M2.73174 46.3642C2.64008 46.4281 2.61808 46.5539 2.68224 46.6451C2.74641 46.7362 2.8729 46.7581 2.96456 46.6943C3.05622 46.6305 3.07822 46.5047 3.01406 46.4135C2.9499 46.3223 2.8234 46.3004 2.73174 46.3642Z" fill="#91D7EC" />
                <path id="Vector_550" d="M3.83131 45.5929C3.73415 45.6495 3.70298 45.7735 3.75798 45.8683C3.81481 45.9649 3.93947 45.9959 4.0348 45.9412C4.13196 45.8847 4.16312 45.7607 4.10813 45.6659C4.0513 45.5692 3.92664 45.5382 3.83131 45.5929Z" fill="#91D7EC" />
                <path id="Vector_551" d="M5.26153 45.0112C5.21203 44.9109 5.0892 44.8708 4.99021 44.9218C4.89122 44.9729 4.84905 45.0933 4.90038 45.1917C4.95171 45.2902 5.0727 45.3321 5.1717 45.2811C5.27253 45.2318 5.31286 45.1097 5.26153 45.0112Z" fill="#91D7EC" />
                <path id="Vector_552" d="M6.35025 44.6957C6.45291 44.6501 6.49874 44.5316 6.45475 44.4294C6.41075 44.3273 6.28976 44.2817 6.18709 44.3255C6.08443 44.3711 6.0386 44.4896 6.0826 44.5917C6.12843 44.6939 6.24759 44.7394 6.35025 44.6957Z" fill="#91D7EC" />
                <path id="Vector_553" d="M7.40821 43.7894C7.30371 43.8313 7.25238 43.9481 7.29455 44.052C7.33671 44.1559 7.45404 44.207 7.55853 44.1651C7.66302 44.1231 7.71435 44.0064 7.67219 43.9025C7.63003 43.7985 7.5127 43.7475 7.40821 43.7894Z" fill="#91D7EC" />
                <path id="Vector_554" d="M8.64746 43.3025C8.54296 43.3408 8.48797 43.4557 8.52646 43.5614C8.56496 43.6654 8.68046 43.7201 8.78678 43.6818C8.89311 43.6435 8.94627 43.5286 8.90778 43.4228C8.86928 43.3171 8.75378 43.2642 8.64746 43.3025Z" fill="#91D7EC" />
                <path id="Vector_555" d="M9.89404 42.8484C9.78955 42.8867 9.73455 43.0016 9.77305 43.1074C9.81154 43.2113 9.92704 43.266 10.0334 43.2277C10.1379 43.1894 10.1929 43.0746 10.1544 42.9688C10.1159 42.863 10.0004 42.8101 9.89404 42.8484Z" fill="#91D7EC" />
                <path id="Vector_556" d="M5.46667 51.0235C5.35485 51.0235 5.26318 51.1147 5.26318 51.2259C5.26318 51.3372 5.35485 51.4283 5.46667 51.4283C5.5785 51.4283 5.67016 51.3372 5.67016 51.2259C5.67016 51.1147 5.5785 51.0235 5.46667 51.0235Z" fill="#91D7EC" />
                <path id="Vector_557" d="M5.41158 50.0971C5.51974 50.1263 5.63157 50.0643 5.6609 49.9567C5.69023 49.8491 5.6279 49.7379 5.51974 49.7087C5.41158 49.6795 5.29975 49.7415 5.27042 49.8491C5.24109 49.9567 5.30342 50.0679 5.41158 50.0971Z" fill="#91D7EC" />
                <path id="Vector_558" d="M5.91422 48.4504C5.81523 48.3976 5.6924 48.4359 5.63924 48.5325C5.58607 48.631 5.62457 48.7532 5.72173 48.806C5.82073 48.8589 5.94355 48.8206 5.99671 48.724C6.04988 48.6255 6.01138 48.5033 5.91422 48.4504Z" fill="#91D7EC" />
                <path id="Vector_559" d="M6.28616 47.3399C6.21649 47.4274 6.23116 47.5532 6.31915 47.6225C6.40715 47.6918 6.53364 47.6772 6.6033 47.5897C6.67297 47.5022 6.6583 47.3763 6.57031 47.307C6.48231 47.2377 6.35582 47.2523 6.28616 47.3399Z" fill="#91D7EC" />
                <path id="Vector_560" d="M7.12927 46.2822C7.0486 46.3588 7.04494 46.4865 7.12193 46.5667C7.19893 46.6469 7.32725 46.6506 7.40792 46.574C7.48858 46.4974 7.49225 46.3698 7.41525 46.2895C7.33825 46.2093 7.20993 46.2056 7.12927 46.2822Z" fill="#91D7EC" />
                <path id="Vector_561" d="M8.35218 45.6786C8.44201 45.6111 8.45851 45.4853 8.39068 45.396C8.32285 45.3066 8.19636 45.2902 8.10653 45.3577C8.0167 45.4251 8.0002 45.551 8.06803 45.6403C8.13586 45.7297 8.26235 45.7461 8.35218 45.6786Z" fill="#91D7EC" />
                <path id="Vector_562" d="M9.17891 44.548C9.08541 44.6082 9.05608 44.7322 9.11658 44.827C9.17707 44.9218 9.30173 44.9492 9.39706 44.889C9.49239 44.8288 9.51989 44.7048 9.45939 44.61C9.39889 44.517 9.27423 44.4878 9.17891 44.548Z" fill="#91D7EC" />
                <path id="Vector_563" d="M10.5152 44.1778C10.6087 44.1176 10.638 43.9936 10.5775 43.8988C10.517 43.8039 10.3924 43.7766 10.297 43.8368C10.2017 43.8969 10.1742 44.0209 10.2347 44.1158C10.2952 44.2088 10.4199 44.238 10.5152 44.1778Z" fill="#91D7EC" />
                <path id="Vector_564" d="M9.75078 52.8106C9.66829 52.8872 9.66462 53.013 9.73979 53.0951C9.81678 53.1771 9.94327 53.1808 10.0258 53.106C10.1083 53.0294 10.1119 52.9036 10.0368 52.8215C9.95977 52.7395 9.83328 52.7358 9.75078 52.8106Z" fill="#91D7EC" />
                <path id="Vector_565" d="M8.90396 51.8058C8.8013 51.8496 8.75364 51.9681 8.79764 52.0702C8.84163 52.1723 8.96079 52.2197 9.06345 52.176C9.16611 52.1322 9.21378 52.0137 9.16978 51.9116C9.12578 51.8094 9.00662 51.762 8.90396 51.8058Z" fill="#91D7EC" />
                <path id="Vector_566" d="M8.4422 50.5767C8.33037 50.5858 8.24788 50.6824 8.25704 50.7937C8.26621 50.9049 8.36337 50.987 8.4752 50.9779C8.58702 50.9687 8.66952 50.8721 8.66035 50.7609C8.65119 50.6496 8.55403 50.5676 8.4422 50.5767Z" fill="#91D7EC" />
                <path id="Vector_567" d="M8.54651 49.5008C8.56851 49.3914 8.49885 49.2856 8.38886 49.2637C8.27886 49.2419 8.17254 49.3112 8.15054 49.4206C8.12854 49.53 8.1982 49.6357 8.3082 49.6576C8.41819 49.6795 8.52452 49.6102 8.54651 49.5008Z" fill="#91D7EC" />
                <path id="Vector_568" d="M8.61413 48.3683C8.72652 48.3683 8.81762 48.2777 8.81762 48.1659C8.81762 48.0541 8.72652 47.9635 8.61413 47.9635C8.50175 47.9635 8.41064 48.0541 8.41064 48.1659C8.41064 48.2777 8.50175 48.3683 8.61413 48.3683Z" fill="#91D7EC" />
                <path id="Vector_569" d="M9.01583 46.853C8.94983 46.9423 8.97 47.07 9.06166 47.1338C9.15149 47.1994 9.27982 47.1794 9.34398 47.0882C9.40997 46.9989 9.38981 46.8712 9.29815 46.8074C9.20832 46.7417 9.07999 46.7618 9.01583 46.853Z" fill="#91D7EC" />
                <path id="Vector_570" d="M10.0993 45.757C10.0187 45.6786 9.89036 45.6804 9.81336 45.7607C9.73454 45.8409 9.73637 45.9686 9.81703 46.0452C9.89769 46.1236 10.026 46.1217 10.103 46.0415C10.18 45.9613 10.18 45.8336 10.0993 45.757Z" fill="#91D7EC" />
                <path id="Vector_571" d="M10.8876 45.1607C11 45.1607 11.0911 45.0701 11.0911 44.9583C11.0911 44.8465 11 44.7559 10.8876 44.7559C10.7752 44.7559 10.6841 44.8465 10.6841 44.9583C10.6841 45.0701 10.7752 45.1607 10.8876 45.1607Z" fill="#91D7EC" />
                <path id="Vector_572" d="M13.6961 52.9929C13.5898 52.9564 13.4743 53.0111 13.4376 53.1169C13.401 53.2227 13.4559 53.3376 13.5623 53.374C13.6686 53.4105 13.7841 53.3558 13.8208 53.25C13.8574 53.1443 13.8024 53.0294 13.6961 52.9929Z" fill="#91D7EC" />
                <path id="Vector_573" d="M12.2128 52.63C12.1468 52.7194 12.1651 52.8452 12.2568 52.9127C12.3466 52.9783 12.4731 52.9601 12.5409 52.8689C12.6069 52.7796 12.5886 52.6537 12.4969 52.5863C12.4071 52.5206 12.2806 52.5389 12.2128 52.63Z" fill="#91D7EC" />
                <path id="Vector_574" d="M11.1917 51.8003C11.0982 51.8623 11.0744 51.9881 11.1386 52.0811C11.2009 52.1741 11.3274 52.1978 11.4209 52.134C11.5144 52.072 11.5382 51.9462 11.4741 51.8532C11.4099 51.7602 11.2852 51.7365 11.1917 51.8003Z" fill="#91D7EC" />
                <path id="Vector_575" d="M10.5097 50.6788C10.4016 50.7062 10.3356 50.8174 10.3649 50.925C10.3924 51.0326 10.5042 51.0982 10.6124 51.0691C10.7205 51.0417 10.7865 50.9305 10.7572 50.8229C10.7297 50.7153 10.6179 50.6496 10.5097 50.6788Z" fill="#91D7EC" />
                <path id="Vector_576" d="M10.431 49.6066C10.4383 49.4953 10.3521 49.4005 10.2403 49.3932C10.1285 49.3859 10.0332 49.4716 10.0258 49.5828C10.0185 49.6941 10.1047 49.7889 10.2165 49.7962C10.3283 49.8035 10.4236 49.7178 10.431 49.6066Z" fill="#91D7EC" />
                <path id="Vector_577" d="M10.1138 48.2133C10.0789 48.3191 10.1358 48.434 10.2421 48.4686C10.3484 48.5033 10.4639 48.4467 10.4987 48.341C10.5336 48.2352 10.4767 48.1203 10.3704 48.0857C10.2641 48.051 10.1486 48.1076 10.1138 48.2133Z" fill="#91D7EC" />
                <path id="Vector_578" d="M10.8309 46.8512C10.7356 46.7946 10.6109 46.8256 10.5522 46.9223C10.4954 47.0189 10.5266 47.1411 10.6237 47.1995C10.7191 47.256 10.8437 47.225 10.9024 47.1283C10.9592 47.0335 10.9281 46.9095 10.8309 46.8512Z" fill="#91D7EC" />
                <path id="Vector_579" d="M11.5091 45.7151C11.4138 45.6585 11.2891 45.6895 11.2305 45.7862C11.1736 45.881 11.2048 46.005 11.302 46.0634C11.3991 46.1199 11.5219 46.0889 11.5806 45.9922C11.6374 45.8974 11.6063 45.7734 11.5091 45.7151Z" fill="#91D7EC" />
                <path id="Vector_580" d="M16.5064 52.6501C16.3946 52.6428 16.2993 52.7285 16.2919 52.8397C16.2846 52.951 16.3708 53.0458 16.4826 53.0531C16.5944 53.0604 16.6897 52.9747 16.6971 52.8635C16.7044 52.7522 16.6183 52.6574 16.5064 52.6501Z" fill="#91D7EC" />
                <path id="Vector_581" d="M15.225 52.579C15.1168 52.548 15.005 52.61 14.9738 52.7176C14.9427 52.8252 15.005 52.9364 15.1132 52.9674C15.2213 52.9984 15.3332 52.9364 15.3643 52.8288C15.3955 52.7212 15.3332 52.61 15.225 52.579Z" fill="#91D7EC" />
                <path id="Vector_582" d="M14.0021 52.238C13.9086 52.1778 13.7821 52.2052 13.7216 52.2982C13.6611 52.3912 13.6886 52.517 13.7821 52.5772C13.8756 52.6373 14.0021 52.61 14.0626 52.517C14.1231 52.424 14.0956 52.2982 14.0021 52.238Z" fill="#91D7EC" />
                <path id="Vector_583" d="M12.6532 51.5304C12.5652 51.5979 12.5487 51.7255 12.6165 51.8131C12.6843 51.9006 12.8127 51.917 12.9007 51.8495C12.9886 51.7821 13.0051 51.6544 12.9373 51.5669C12.8695 51.4793 12.7412 51.4629 12.6532 51.5304Z" fill="#91D7EC" />
                <path id="Vector_584" d="M11.9048 50.4509C11.7985 50.4837 11.7399 50.5986 11.7729 50.7044C11.8059 50.8101 11.9213 50.8685 12.0277 50.8357C12.134 50.8029 12.1927 50.688 12.1597 50.5822C12.1267 50.4764 12.0112 50.4181 11.9048 50.4509Z" fill="#91D7EC" />
                <path id="Vector_585" d="M11.5676 49.1835C11.4558 49.1835 11.3641 49.271 11.3623 49.3822C11.3623 49.4935 11.4503 49.5847 11.5621 49.5865C11.674 49.5865 11.7656 49.4989 11.7674 49.3877C11.7674 49.2765 11.6795 49.1853 11.5676 49.1835Z" fill="#91D7EC" />
                <path id="Vector_586" d="M11.6412 47.8706C11.533 47.8396 11.4212 47.8997 11.39 48.0073C11.3588 48.1149 11.4193 48.2262 11.5275 48.2572C11.6357 48.2882 11.7475 48.228 11.7787 48.1204C11.8098 48.0128 11.7493 47.9016 11.6412 47.8706Z" fill="#91D7EC" />
                <path id="Vector_587" d="M11.903 46.9916C12.0112 47.0226 12.123 46.9624 12.1541 46.8548C12.1853 46.7472 12.1248 46.636 12.0167 46.605C11.9085 46.574 11.7967 46.6342 11.7655 46.7418C11.7343 46.8494 11.7948 46.9606 11.903 46.9916Z" fill="#91D7EC" />
                <path id="Vector_588" d="M18.9153 52.3638C18.908 52.2927 18.864 52.238 18.8053 52.207C18.7687 52.2653 18.7045 52.3054 18.6293 52.3036C18.5982 52.3036 18.5707 52.2927 18.545 52.2799C18.523 52.3164 18.5084 52.3565 18.5139 52.4021C18.5249 52.5133 18.6238 52.5936 18.7357 52.5844C18.8475 52.5735 18.9282 52.475 18.919 52.3638H18.9153Z" fill="#91D7EC" />
                <path id="Vector_589" d="M17.4049 52.3091C17.3499 52.3054 17.2985 52.3255 17.26 52.3583C17.2215 52.393 17.194 52.4422 17.1904 52.4969C17.183 52.6081 17.2692 52.703 17.381 52.7103C17.458 52.7157 17.5259 52.6738 17.5644 52.6136C17.5809 52.5863 17.5937 52.5571 17.5955 52.5224C17.6029 52.4112 17.5167 52.3164 17.4049 52.3091Z" fill="#91D7EC" />
                <path id="Vector_590" d="M16.1231 52.2362C16.0149 52.2052 15.9031 52.2653 15.8719 52.3729C15.8408 52.4805 15.9013 52.5918 16.0094 52.6228C16.1176 52.6538 16.2294 52.5936 16.2606 52.486C16.2918 52.3784 16.2313 52.2672 16.1231 52.2362Z" fill="#91D7EC" />
                <path id="Vector_591" d="M14.9041 51.8878C14.8106 51.8258 14.6841 51.8514 14.6236 51.9444C14.5631 52.0374 14.5869 52.1632 14.6804 52.2234C14.7739 52.2835 14.9004 52.2598 14.9609 52.1668C15.0232 52.0738 14.9976 51.948 14.9041 51.8878Z" fill="#91D7EC" />
                <path id="Vector_592" d="M13.5642 51.1675C13.4744 51.235 13.4561 51.3608 13.5239 51.4502C13.5917 51.5396 13.7182 51.5578 13.8081 51.4903C13.8979 51.4228 13.9162 51.297 13.8484 51.2077C13.7806 51.1183 13.6541 51.1001 13.5642 51.1675Z" fill="#91D7EC" />
                <path id="Vector_593" d="M12.8327 50.0771C12.7245 50.1081 12.664 50.2211 12.697 50.3287C12.73 50.4363 12.8418 50.4965 12.95 50.4637C13.0581 50.4308 13.1186 50.3196 13.0856 50.212C13.0526 50.1044 12.9408 50.0442 12.8327 50.0771Z" fill="#91D7EC" />
                <path id="Vector_594" d="M12.5044 49.2054C12.6162 49.209 12.7097 49.1215 12.7134 49.0102C12.717 48.899 12.629 48.806 12.5172 48.8024C12.4054 48.7987 12.3119 48.8862 12.3082 48.9975C12.3045 49.1087 12.3925 49.2017 12.5044 49.2054Z" fill="#91D7EC" />
                <path id="Vector_595" d="M12.5464 47.8833C12.6582 47.8869 12.7517 47.7994 12.7554 47.6882C12.759 47.5769 12.671 47.4839 12.5592 47.4803C12.4474 47.4766 12.3539 47.5642 12.3502 47.6754C12.3465 47.7866 12.4345 47.8796 12.5464 47.8833Z" fill="#91D7EC" />
                <path id="Vector_596" d="M20.556 51.9827C20.556 51.9827 20.5468 51.979 20.5431 51.9772C20.5266 51.9736 20.512 51.9644 20.4973 51.9553C20.4661 51.9918 20.4221 52.0191 20.369 52.0246C20.3506 52.0264 20.3323 52.0246 20.314 52.021C20.3561 52.0921 20.4386 52.134 20.5248 52.1176C20.5596 52.1103 20.5889 52.0939 20.6146 52.072C20.5871 52.0483 20.5651 52.0191 20.5541 51.9827H20.556Z" fill="#91D7EC" />
                <path id="Vector_597" d="M19.2561 52.2051C19.2286 52.1906 19.2066 52.1705 19.1882 52.1468C19.1791 52.1431 19.1717 52.1377 19.1644 52.1322C19.1277 52.165 19.0782 52.1869 19.0232 52.1851C19.0086 52.1851 18.9957 52.1796 18.9829 52.176C18.9829 52.176 18.9829 52.1796 18.9829 52.1814C18.9921 52.2927 19.0892 52.3747 19.2011 52.3674C19.2341 52.3656 19.2616 52.3529 19.2872 52.3383C19.2707 52.3146 19.2579 52.2872 19.2524 52.2562C19.2506 52.2398 19.2524 52.2252 19.2542 52.2088L19.2561 52.2051Z" fill="#91D7EC" />
                <path id="Vector_598" d="M17.986 52.2872C17.9035 52.2726 17.843 52.2106 17.8246 52.134C17.8191 52.1286 17.8136 52.1231 17.8081 52.1176C17.7751 52.1377 17.7385 52.1468 17.6981 52.145C17.6761 52.1741 17.6596 52.207 17.656 52.2453C17.6468 52.3565 17.7275 52.455 17.8393 52.4641C17.876 52.4677 17.909 52.4586 17.9401 52.444C17.9401 52.4349 17.9346 52.4276 17.9346 52.4185C17.9346 52.3674 17.953 52.3219 17.9841 52.2872H17.986Z" fill="#91D7EC" />
                <path id="Vector_599" d="M16.6293 52.0994C16.5633 52.0721 16.5229 52.0137 16.5101 51.9481C16.4368 51.9572 16.3708 52.0064 16.3451 52.0812C16.3085 52.1869 16.3653 52.3018 16.4716 52.3365C16.5779 52.373 16.6934 52.3164 16.7283 52.2107C16.7393 52.176 16.7393 52.1432 16.7319 52.1085C16.6971 52.114 16.6623 52.1122 16.6274 52.0976L16.6293 52.0994Z" fill="#91D7EC" />
                <path id="Vector_600" d="M15.3185 51.525C15.2451 51.5104 15.1663 51.5377 15.1186 51.6015C15.0526 51.6909 15.071 51.8167 15.1608 51.8842C15.2506 51.9498 15.3771 51.9316 15.445 51.8423C15.5 51.7693 15.4945 51.6727 15.4413 51.6034C15.4065 51.5961 15.3735 51.5851 15.346 51.5614C15.335 51.5523 15.3276 51.5377 15.3185 51.5268V51.525Z" fill="#91D7EC" />
                <path id="Vector_601" d="M14.1031 50.7645C14.0096 50.8265 13.9839 50.9505 14.0444 51.0435C14.1067 51.1365 14.2314 51.1621 14.3249 51.1019C14.4184 51.0399 14.4441 50.9159 14.3836 50.8229C14.3231 50.7299 14.1966 50.7043 14.1031 50.7645Z" fill="#91D7EC" />
                <path id="Vector_602" d="M13.531 50.0278C13.6391 50.0022 13.707 49.8947 13.6813 49.7852C13.6556 49.6777 13.5475 49.6102 13.4375 49.6357C13.3293 49.6612 13.2615 49.7688 13.2872 49.8782C13.3128 49.9858 13.421 50.0533 13.531 50.0278Z" fill="#91D7EC" />
                <path id="Vector_603" d="M13.3791 48.4978C13.3534 48.3902 13.2452 48.3228 13.1352 48.3483C13.0271 48.3738 12.9593 48.4814 12.9849 48.5908C13.0106 48.6984 13.1187 48.7659 13.2287 48.7404C13.3369 48.7148 13.4047 48.6072 13.3791 48.4978Z" fill="#91D7EC" />
                <path id="Vector_604" d="M22.1124 51.3791C22.0757 51.3298 22.0189 51.3025 21.9565 51.3007C21.9895 51.3134 22.0189 51.3317 22.0427 51.359C22.0665 51.3608 22.0904 51.3681 22.1124 51.3791Z" fill="#91D7EC" />
                <path id="Vector_605" d="M20.7853 51.7256C20.8072 51.7292 20.8292 51.7383 20.8476 51.7493C20.8256 51.6818 20.7724 51.6326 20.7046 51.6161C20.7431 51.6417 20.7706 51.68 20.7834 51.7256H20.7853Z" fill="#91D7EC" />
                <path id="Vector_606" d="M20.543 51.9772C20.543 51.9772 20.5521 51.9807 20.5558 51.9825C20.5558 51.9825 20.5558 51.979 20.5539 51.9772C20.5503 51.9772 20.5466 51.9772 20.5448 51.9772H20.543Z" fill="#91D7EC" />
                <path id="Vector_607" d="M19.4707 52.0265C19.4982 52.0283 19.5239 52.0356 19.5477 52.0483C19.5477 52.0392 19.5532 52.0301 19.5514 52.021C19.5477 51.9462 19.5037 51.886 19.4414 51.855C19.4652 51.8879 19.4817 51.9243 19.4817 51.9681C19.4817 51.9882 19.4762 52.0082 19.4707 52.0265Z" fill="#91D7EC" />
                <path id="Vector_608" d="M19.2563 52.2051C19.2563 52.1924 19.2563 52.1796 19.2618 52.1669C19.2361 52.165 19.2123 52.1577 19.1885 52.1468C19.2068 52.1723 19.2288 52.1924 19.2563 52.2051Z" fill="#91D7EC" />
                <path id="Vector_609" d="M17.9122 52.1778C17.8774 52.1705 17.8499 52.1541 17.8242 52.134C17.8407 52.2106 17.903 52.2726 17.9855 52.2872C18.0222 52.2435 18.0754 52.2143 18.1359 52.2143C18.1487 52.2143 18.1597 52.2179 18.1707 52.2216C18.1964 52.1924 18.2165 52.1596 18.222 52.1194C18.2312 52.0483 18.2 51.9845 18.1505 51.9407C18.156 51.9663 18.156 51.9918 18.1505 52.0192C18.1285 52.1286 18.0222 52.1997 17.914 52.1796L17.9122 52.1778Z" fill="#91D7EC" />
                <path id="Vector_610" d="M16.8457 51.7675C16.842 51.7858 16.8402 51.804 16.831 51.8222C16.7815 51.9225 16.6587 51.9626 16.5597 51.9116C16.5414 51.9025 16.5286 51.8897 16.5139 51.8751C16.5084 51.9006 16.5084 51.9243 16.5139 51.948C16.5249 52.0137 16.5652 52.0721 16.6331 52.0994C16.6679 52.114 16.7027 52.114 16.7375 52.1103C16.7944 52.1031 16.8457 52.0702 16.8769 52.021C16.8842 52.01 16.8934 52.0028 16.897 51.99C16.93 51.9098 16.908 51.8222 16.8475 51.7675H16.8457Z" fill="#91D7EC" />
                <path id="Vector_611" d="M15.6026 51.2825C15.5237 51.359 15.3991 51.3572 15.3221 51.2825C15.2634 51.3554 15.2653 51.452 15.3184 51.525C15.3276 51.5359 15.3331 51.5505 15.3459 51.5596C15.3734 51.5833 15.4064 51.5961 15.4413 51.6016C15.5091 51.6143 15.5824 51.5961 15.6319 51.5396C15.7034 51.4575 15.6961 51.3372 15.6172 51.2624C15.6117 51.2697 15.6099 51.277 15.6026 51.2825Z" fill="#91D7EC" />
                <path id="Vector_612" d="M14.6549 50.4436C14.6402 50.4162 14.62 50.3962 14.5962 50.3779C14.5375 50.3962 14.4734 50.3852 14.422 50.3488C14.4074 50.3524 14.3927 50.3542 14.3799 50.3615C14.2809 50.4144 14.246 50.5366 14.2992 50.6351C14.3524 50.7335 14.4752 50.7682 14.5742 50.7153C14.6732 50.6624 14.708 50.5402 14.6549 50.4418V50.4436Z" fill="#91D7EC" />
                <path id="Vector_613" d="M14.0225 49.2838C13.9694 49.1853 13.8465 49.1507 13.7475 49.2036C13.6485 49.2564 13.6137 49.3786 13.6669 49.4771C13.72 49.5756 13.8429 49.6102 13.9419 49.5573C14.0409 49.5044 14.0757 49.3823 14.0225 49.2838Z" fill="#91D7EC" />
                <path id="Vector_614" d="M23.0968 51.0946C23.117 51.0344 23.1591 50.9833 23.2251 50.9633C23.2416 50.9578 23.2581 50.9596 23.2746 50.9578C23.227 50.9268 23.1683 50.9159 23.1115 50.9323C23.0638 50.945 23.029 50.976 23.0015 51.0125C23.0418 51.0289 23.0748 51.0563 23.0986 51.0946H23.0968Z" fill="#91D7EC" />
                <path id="Vector_615" d="M21.8299 51.6198C21.8225 51.6362 21.8152 51.6526 21.8042 51.6672C21.8225 51.6763 21.8427 51.6836 21.8647 51.6855C21.85 51.6672 21.8372 51.6435 21.8299 51.6198Z" fill="#91D7EC" />
                <path id="Vector_616" d="M21.8353 51.4866C21.8573 51.4301 21.9013 51.3827 21.9655 51.3645C21.9912 51.3572 22.0168 51.3553 22.0407 51.359C22.0168 51.3316 21.9875 51.3134 21.9545 51.3006C21.9197 51.2879 21.8812 51.2824 21.8427 51.2915C21.795 51.3025 21.7565 51.3316 21.729 51.3681C21.7785 51.3918 21.817 51.4338 21.8353 51.4885V51.4866Z" fill="#91D7EC" />
                <path id="Vector_617" d="M20.5485 51.8021C20.5558 51.8605 20.5356 51.9152 20.499 51.9571C20.5136 51.9644 20.5283 51.9736 20.5448 51.979C20.5485 51.979 20.5521 51.979 20.554 51.979C20.554 51.9754 20.5503 51.9735 20.5503 51.9699C20.5246 51.8623 20.5925 51.7529 20.7025 51.7274C20.7318 51.7201 20.7593 51.7219 20.7868 51.7274C20.7721 51.6818 20.7464 51.6435 20.708 51.618C20.6676 51.5924 20.62 51.5778 20.5686 51.5851C20.5191 51.5924 20.477 51.618 20.4458 51.6544C20.5008 51.6854 20.543 51.7365 20.5503 51.804L20.5485 51.8021Z" fill="#91D7EC" />
                <path id="Vector_618" d="M19.2307 51.9882C19.2307 52.0447 19.2032 52.0958 19.1647 52.1322C19.172 52.1377 19.1794 52.1432 19.1885 52.1468C19.2105 52.1578 19.2344 52.1651 19.2619 52.1669C19.2839 52.0939 19.3444 52.0356 19.425 52.0246C19.4415 52.0228 19.4562 52.0246 19.4708 52.0265C19.4763 52.0082 19.4818 51.9882 19.4818 51.9681C19.4818 51.9243 19.4653 51.8879 19.4415 51.855C19.4048 51.804 19.3462 51.7675 19.2784 51.7675C19.227 51.7675 19.1812 51.7894 19.1445 51.8204C19.1977 51.8587 19.2325 51.917 19.2307 51.9863V51.9882Z" fill="#91D7EC" />
                <path id="Vector_619" d="M17.8976 51.9973C17.8847 52.0502 17.8517 52.0921 17.8096 52.1195C17.8151 52.1249 17.8187 52.1304 17.8261 52.1359C17.8517 52.1559 17.8792 52.1742 17.9141 52.1797C18.0241 52.2015 18.1304 52.1286 18.1506 52.0192C18.1561 51.9918 18.1542 51.9663 18.1506 51.9408C18.1341 51.8642 18.0736 51.7985 17.9911 51.7839C17.9379 51.773 17.8866 51.7858 17.8444 51.8131C17.8921 51.8605 17.9159 51.9298 17.8994 51.9991L17.8976 51.9973Z" fill="#91D7EC" />
                <path id="Vector_620" d="M16.8288 51.8222C16.838 51.804 16.8398 51.7857 16.8435 51.7675C16.86 51.6818 16.8215 51.5924 16.739 51.5523C16.6895 51.5268 16.6345 51.525 16.585 51.5414C16.618 51.6016 16.6235 51.6745 16.585 51.7383C16.5593 51.7821 16.5171 51.8113 16.4731 51.8259C16.4841 51.8441 16.4951 51.8605 16.5116 51.8769C16.5263 51.8897 16.5391 51.9043 16.5575 51.9134C16.6583 51.9626 16.7793 51.9225 16.8288 51.824V51.8222Z" fill="#91D7EC" />
                <path id="Vector_621" d="M15.6025 51.2824C15.6025 51.2824 15.6116 51.2678 15.6171 51.2623C15.6794 51.1839 15.6794 51.0709 15.608 50.9979C15.5676 50.9578 15.5163 50.9377 15.4631 50.9377C15.4705 50.9833 15.465 51.0307 15.4411 51.0727C15.4026 51.1365 15.3348 51.1693 15.2651 51.1693C15.2706 51.2095 15.2853 51.2478 15.3165 51.2788C15.3165 51.2788 15.3201 51.2806 15.322 51.2824C15.4008 51.3572 15.5236 51.359 15.6025 51.2824Z" fill="#91D7EC" />
                <path id="Vector_622" d="M14.5962 50.3797C14.6255 50.3706 14.653 50.356 14.6769 50.3342C14.7575 50.2576 14.7594 50.1299 14.6824 50.0497C14.6054 49.9694 14.477 49.9676 14.3964 50.0442C14.3157 50.1208 14.3139 50.2484 14.3909 50.3287C14.4 50.3378 14.411 50.3433 14.422 50.3506C14.4734 50.387 14.5375 50.398 14.5962 50.3797Z" fill="#91D7EC" />
                <path id="Vector_623" d="M24.1052 50.9396C24.1107 50.9542 24.1107 50.9706 24.1125 50.9852C24.1565 51.0034 24.206 51.0107 24.2536 50.9961C24.2536 50.9961 24.2555 50.9961 24.2573 50.9943C24.2536 50.987 24.2481 50.9833 24.2445 50.976C24.2041 50.8776 24.25 50.77 24.3416 50.7226C24.3416 50.708 24.3471 50.6934 24.3508 50.6806C24.2995 50.6168 24.2151 50.5876 24.1327 50.6132C24.0392 50.6423 23.986 50.7335 23.9952 50.8265C24.0447 50.8484 24.085 50.8867 24.1052 50.9414V50.9396Z" fill="#91D7EC" />
                <path id="Vector_624" d="M22.8513 51.3809C22.8916 51.3973 22.9356 51.4028 22.9796 51.3918C22.9887 51.39 22.9942 51.3846 23.0016 51.3809C23.0071 51.3171 23.0419 51.2606 23.0969 51.2259C23.0969 51.2223 23.0932 51.2204 23.0914 51.2168C23.0786 51.1748 23.0822 51.1329 23.0951 51.0946C23.0712 51.0563 23.0382 51.029 22.9979 51.0125C22.9576 50.9961 22.9136 50.9907 22.8696 51.0016C22.7614 51.0308 22.6991 51.142 22.7284 51.2496C22.7303 51.2587 22.7376 51.266 22.7413 51.2733C22.7889 51.2934 22.8274 51.3298 22.8494 51.3791L22.8513 51.3809Z" fill="#91D7EC" />
                <path id="Vector_625" d="M21.6872 51.7438C21.7367 51.7328 21.7752 51.7037 21.8045 51.6672C21.8155 51.6526 21.8229 51.6362 21.8302 51.6198C21.8302 51.618 21.8284 51.6161 21.8265 51.6143C21.8137 51.5705 21.8192 51.5268 21.8357 51.4885C21.8174 51.4338 21.7789 51.3918 21.7294 51.3681C21.6909 51.3499 21.6469 51.3408 21.6029 51.3499C21.4929 51.3736 21.4232 51.4812 21.4471 51.5888C21.4709 51.6982 21.579 51.7675 21.6872 51.7438Z" fill="#91D7EC" />
                <path id="Vector_626" d="M20.4993 51.9572C20.536 51.9152 20.5562 51.8605 20.5488 51.8022C20.5415 51.7347 20.4993 51.6836 20.4443 51.6526C20.4077 51.6326 20.3674 51.6216 20.3252 51.6253C20.2134 51.638 20.1345 51.7383 20.1474 51.8496C20.1584 51.9407 20.2317 52.0082 20.3179 52.021C20.3362 52.0246 20.3527 52.0283 20.3729 52.0246C20.4242 52.0192 20.4682 51.9918 20.5012 51.9553L20.4993 51.9572Z" fill="#91D7EC" />
                <path id="Vector_627" d="M19.1645 52.1304C19.2048 52.0939 19.2305 52.0447 19.2305 51.9863C19.2305 51.917 19.1957 51.8587 19.1443 51.8204C19.1132 51.7985 19.0765 51.7803 19.0343 51.7803C18.9225 51.7766 18.829 51.866 18.8272 51.9772C18.8254 52.0739 18.8932 52.1523 18.9848 52.1741C18.9977 52.1778 19.0105 52.1833 19.0252 52.1833C19.0802 52.1833 19.1297 52.1632 19.1663 52.1304H19.1645Z" fill="#91D7EC" />
                <path id="Vector_628" d="M17.8096 52.1194C17.8518 52.0921 17.8848 52.0501 17.8976 51.9972C17.9141 51.9279 17.8903 51.8586 17.8426 51.8112C17.8169 51.7857 17.7858 51.762 17.7473 51.7529C17.6391 51.7274 17.5291 51.793 17.5016 51.9006C17.476 52.0082 17.542 52.1176 17.6501 52.145C17.6666 52.1486 17.6813 52.1468 17.6978 52.1468C17.7363 52.1468 17.7748 52.1395 17.8078 52.1194H17.8096Z" fill="#91D7EC" />
                <path id="Vector_629" d="M16.5871 51.7365C16.6237 51.6726 16.6201 51.5997 16.5871 51.5395C16.5706 51.5085 16.5486 51.4812 16.5156 51.4611C16.4404 51.4174 16.3506 51.4283 16.2864 51.4793C16.2681 51.4939 16.2498 51.5122 16.2369 51.5341C16.2131 51.5742 16.2076 51.6198 16.2149 51.6635C16.2186 51.6763 16.2223 51.6891 16.2241 51.7036C16.2388 51.7474 16.2681 51.7857 16.3103 51.8112C16.3616 51.8422 16.4221 51.8441 16.4753 51.8277C16.5211 51.8131 16.5614 51.7839 16.5871 51.7401V51.7365Z" fill="#91D7EC" />
                <path id="Vector_630" d="M15.4415 51.0709C15.4671 51.0289 15.4708 50.9815 15.4635 50.9359C15.4543 50.8794 15.4231 50.8265 15.3681 50.7955C15.271 50.739 15.1481 50.7718 15.0913 50.8685C15.0345 50.9651 15.0675 51.0873 15.1646 51.1438C15.1958 51.1621 15.2306 51.1675 15.2655 51.1675C15.3351 51.1675 15.403 51.1347 15.4415 51.0709Z" fill="#91D7EC" />
                <path id="Vector_631" d="M24.9995 50.6989C24.9995 50.6989 25.005 50.688 25.0087 50.6843C24.994 50.6679 24.9812 50.6478 24.9739 50.626C24.9354 50.522 24.9904 50.4053 25.0949 50.367C25.1187 50.3579 25.1425 50.3561 25.1663 50.3561C25.1168 50.3269 25.0582 50.3178 25.0014 50.336C24.895 50.3707 24.8382 50.4855 24.873 50.5913C24.8785 50.6077 24.8895 50.6205 24.8969 50.6351C24.9372 50.6442 24.972 50.6661 25.0014 50.6989H24.9995Z" fill="#91D7EC" />
                <path id="Vector_632" d="M23.8466 50.8192C23.8851 50.8046 23.9236 50.8065 23.9602 50.8156C23.9089 50.7554 23.8246 50.7262 23.7439 50.7518C23.6376 50.7846 23.5771 50.8976 23.6101 51.0034C23.6321 51.0745 23.6926 51.1238 23.7622 51.1384C23.7476 51.1201 23.7329 51.1001 23.7256 51.0782C23.6871 50.9742 23.7421 50.8575 23.8466 50.8192Z" fill="#91D7EC" />
                <path id="Vector_633" d="M22.4753 51.5231C22.4405 51.4192 22.4936 51.3061 22.5981 51.2678C22.6403 51.2532 22.6843 51.255 22.7246 51.2678C22.6898 51.1693 22.5853 51.111 22.4826 51.1383C22.3745 51.1675 22.3103 51.2788 22.3396 51.3863C22.358 51.4556 22.4111 51.5012 22.4753 51.5213V51.5231Z" fill="#91D7EC" />
                <path id="Vector_634" d="M21.2179 51.8805C21.227 51.8058 21.2747 51.7401 21.3517 51.7128C21.3865 51.7 21.4214 51.7018 21.4544 51.7073C21.458 51.6854 21.458 51.6635 21.4544 51.6398C21.4305 51.5304 21.3242 51.4611 21.2142 51.4848C21.1042 51.5085 21.0346 51.6143 21.0584 51.7237C21.0749 51.8058 21.1409 51.8659 21.2197 51.8805H21.2179Z" fill="#91D7EC" />
                <path id="Vector_635" d="M20.1563 51.9316C20.1435 51.8204 20.0426 51.742 19.9326 51.7529C19.8208 51.7657 19.742 51.866 19.753 51.9754C19.7658 52.0866 19.8666 52.165 19.9766 52.1541C20.0885 52.1413 20.1673 52.041 20.1563 51.9316Z" fill="#91D7EC" />
                <path id="Vector_636" d="M18.8055 52.207C18.8238 52.1778 18.8366 52.1468 18.8385 52.1103C18.8421 51.9991 18.756 51.9061 18.6441 51.9006C18.5323 51.897 18.4388 51.9827 18.4333 52.0939C18.4296 52.1742 18.4755 52.2453 18.5433 52.2799C18.569 52.2927 18.5965 52.3018 18.6276 52.3036C18.7028 52.3073 18.767 52.2653 18.8036 52.207H18.8055Z" fill="#91D7EC" />
                <path id="Vector_637" d="M17.3588 51.8587C17.2507 51.8313 17.1407 51.8952 17.1113 52.0027C17.0838 52.1103 17.148 52.2197 17.2562 52.2489C17.3643 52.2763 17.4743 52.2125 17.5037 52.1049C17.5311 51.9973 17.467 51.8879 17.3588 51.8587Z" fill="#91D7EC" />
                <path id="Vector_638" d="M16.2131 51.6635C16.193 51.5979 16.1453 51.5432 16.0738 51.5249C15.9656 51.4976 15.8556 51.5614 15.8263 51.669C15.797 51.7766 15.863 51.886 15.9711 51.9152C16.0793 51.9425 16.1893 51.8787 16.2186 51.7711C16.2241 51.7474 16.2241 51.7255 16.2223 51.7037C16.2223 51.6891 16.2168 51.6781 16.2131 51.6635Z" fill="#91D7EC" />
                <path id="Vector_639" d="M25.9528 50.1682C25.8996 50.1062 25.8135 50.0807 25.7328 50.108C25.6723 50.1281 25.632 50.1755 25.6118 50.2302C25.7126 50.1992 25.8226 50.2484 25.8611 50.3469C25.8795 50.3943 25.8776 50.4436 25.8611 50.4891C25.863 50.4891 25.8648 50.4891 25.8666 50.4891C25.8886 50.4819 25.907 50.4691 25.9235 50.4545C25.9088 50.4381 25.896 50.4217 25.8868 50.4016C25.852 50.3159 25.8813 50.2229 25.9528 50.1682Z" fill="#91D7EC" />
                <path id="Vector_640" d="M24.3433 50.7208C24.3433 50.7208 24.3524 50.7135 24.3579 50.7116C24.4624 50.6697 24.5797 50.7189 24.6219 50.8229C24.6329 50.8502 24.6366 50.8794 24.6366 50.9068C24.6457 50.9031 24.6531 50.8976 24.6604 50.8922C24.6311 50.8065 24.6622 50.7153 24.7374 50.6642C24.7007 50.5603 24.5871 50.5037 24.4808 50.5384C24.4148 50.5603 24.3708 50.615 24.3543 50.677C24.3506 50.6916 24.3451 50.7043 24.3451 50.7189L24.3433 50.7208Z" fill="#91D7EC" />
                <path id="Vector_641" d="M23.0966 51.0946C23.0838 51.1329 23.0801 51.1748 23.0929 51.2168C23.0929 51.2204 23.0966 51.2223 23.0984 51.2259C23.1058 51.2204 23.1131 51.2131 23.1223 51.2095C23.2249 51.1657 23.3441 51.2131 23.3881 51.3153C23.3881 51.3189 23.3881 51.3207 23.3899 51.3244C23.4669 51.277 23.5091 51.184 23.4798 51.0946C23.4504 51.0053 23.3643 50.9524 23.2744 50.9578C23.2579 50.9578 23.2414 50.9578 23.2249 50.9633C23.1608 50.9834 23.1168 51.0344 23.0966 51.0946Z" fill="#91D7EC" />
                <path id="Vector_642" d="M22.0409 51.3572C22.0153 51.3553 21.9896 51.3572 21.9658 51.3626C21.9016 51.3809 21.8576 51.4283 21.8356 51.4848C21.8209 51.5249 21.8136 51.5669 21.8264 51.6106C21.8264 51.6125 21.8283 51.6143 21.8301 51.6161C21.8374 51.6398 21.8503 51.6635 21.8649 51.6818C21.8796 51.7 21.8979 51.7128 21.9163 51.7255C21.9749 51.7055 22.0354 51.7146 22.0849 51.7438C22.1876 51.7091 22.2463 51.6015 22.2151 51.4976C22.1986 51.441 22.1601 51.3991 22.1106 51.3736C22.0886 51.3626 22.0648 51.3553 22.0409 51.3535V51.3572Z" fill="#91D7EC" />
                <path id="Vector_643" d="M20.7009 51.7255C20.5927 51.7511 20.5249 51.8587 20.5487 51.9681C20.5487 51.9717 20.5524 51.9735 20.5524 51.9772C20.5524 51.9772 20.5524 51.9808 20.5542 51.9827C20.5652 52.0191 20.5872 52.0483 20.6147 52.072C20.6624 52.1121 20.7247 52.134 20.7907 52.1176C20.8989 52.0921 20.9667 51.9845 20.9429 51.8751C20.93 51.8185 20.8934 51.7748 20.8457 51.7474C20.8255 51.7365 20.8054 51.7274 20.7834 51.7237C20.7559 51.7182 20.7284 51.7182 20.699 51.7237L20.7009 51.7255Z" fill="#91D7EC" />
                <path id="Vector_644" d="M19.4833 52.4222C19.5933 52.4057 19.6703 52.3036 19.6538 52.1924C19.6447 52.1267 19.6025 52.0757 19.5475 52.0465C19.5237 52.0337 19.498 52.0264 19.4705 52.0246C19.4558 52.0246 19.4393 52.0192 19.4247 52.0228C19.344 52.0337 19.2835 52.0921 19.2615 52.165C19.2579 52.1778 19.2579 52.1906 19.256 52.2033C19.256 52.2197 19.2505 52.2343 19.2542 52.2507C19.2597 52.2817 19.2725 52.3091 19.289 52.3328C19.3312 52.3948 19.4063 52.4313 19.4852 52.4203L19.4833 52.4222Z" fill="#91D7EC" />
                <path id="Vector_645" d="M18.1712 52.2216C18.1583 52.2198 18.1492 52.2143 18.1363 52.2143C18.0758 52.2143 18.0227 52.2453 17.986 52.2872C17.9549 52.3237 17.9365 52.3693 17.9365 52.4185C17.9365 52.4277 17.9402 52.4349 17.942 52.4441C17.9567 52.5425 18.0392 52.6191 18.1418 52.6173C18.2537 52.6155 18.3435 52.5243 18.3417 52.4131C18.3417 52.3146 18.2665 52.2362 18.1712 52.2216Z" fill="#91D7EC" />
                <path id="Vector_646" d="M16.8068 52.2379C16.695 52.2398 16.6051 52.3309 16.607 52.4422C16.6088 52.5534 16.7005 52.6428 16.8123 52.641C16.9241 52.6391 17.0139 52.5479 17.0121 52.4367C17.0103 52.3255 16.9186 52.2361 16.8068 52.2379Z" fill="#91D7EC" />
                <path id="Vector_647" d="M26.3013 50.0843C26.3618 50.057 26.4278 50.0661 26.481 50.0953C26.492 50.088 26.5012 50.077 26.514 50.0715C26.5433 50.057 26.5745 50.0533 26.6038 50.0533C26.6038 50.0478 26.6038 50.0442 26.602 50.0387C26.5635 49.9348 26.448 49.8801 26.3417 49.9184C26.2427 49.9548 26.1913 50.0588 26.217 50.1573C26.2372 50.1263 26.2647 50.0989 26.2995 50.0825L26.3013 50.0843Z" fill="#91D7EC" />
                <path id="Vector_648" d="M24.9742 50.626C24.9816 50.6478 24.9962 50.6661 25.009 50.6843C25.0274 50.6588 25.0494 50.6369 25.0805 50.6223C25.1539 50.5858 25.24 50.5986 25.2987 50.6478C25.2987 50.6478 25.3005 50.646 25.3024 50.6442C25.317 50.6351 25.3354 50.6333 25.3519 50.6278C25.3684 50.584 25.372 50.5348 25.3555 50.4874C25.3262 50.4053 25.2492 50.3561 25.1667 50.3561C25.1429 50.3561 25.119 50.3579 25.0952 50.367C24.9907 50.4053 24.9357 50.5202 24.9742 50.626Z" fill="#91D7EC" />
                <path id="Vector_649" d="M23.9914 51.1931C24.0757 51.1584 24.1234 51.0727 24.1124 50.9852C24.1124 50.9688 24.1124 50.9542 24.105 50.9396C24.0849 50.8849 24.0445 50.8466 23.995 50.8247C23.984 50.8193 23.9712 50.8193 23.9584 50.8156C23.9217 50.8065 23.8832 50.8047 23.8447 50.8193C23.7402 50.8576 23.6852 50.9724 23.7237 51.0782C23.7329 51.1019 23.7457 51.122 23.7604 51.1384C23.7971 51.1803 23.8466 51.2059 23.9016 51.2095C23.9309 51.1967 23.9602 51.1931 23.9895 51.1931H23.9914Z" fill="#91D7EC" />
                <path id="Vector_650" d="M22.5983 51.2697C22.4938 51.3062 22.4407 51.421 22.4755 51.525C22.4755 51.525 22.4755 51.5268 22.4755 51.5286C22.514 51.6326 22.6295 51.6873 22.734 51.6508C22.8385 51.6125 22.8935 51.4976 22.8568 51.3937C22.8568 51.39 22.8513 51.3864 22.8495 51.3827C22.8275 51.3335 22.789 51.2952 22.7413 51.277C22.7358 51.2752 22.7303 51.2752 22.723 51.2733C22.6826 51.2606 22.6386 51.2587 22.5965 51.2733L22.5983 51.2697Z" fill="#91D7EC" />
                <path id="Vector_651" d="M21.3514 51.7146C21.2763 51.7401 21.2268 51.8076 21.2176 51.8824C21.2139 51.9115 21.2158 51.9425 21.2249 51.9717C21.2616 52.0775 21.3771 52.1322 21.4834 52.0957C21.5897 52.0593 21.6447 51.9444 21.6081 51.8386C21.5824 51.7675 21.5219 51.7219 21.4522 51.7091C21.4192 51.7037 21.3844 51.7018 21.3496 51.7146H21.3514Z" fill="#91D7EC" />
                <path id="Vector_652" d="M20.2262 52.5316C20.3325 52.4969 20.3912 52.382 20.3563 52.2763C20.3215 52.1705 20.206 52.1121 20.0997 52.1468C19.9934 52.1814 19.9347 52.2963 19.9695 52.4021C20.0044 52.5078 20.1198 52.5662 20.2262 52.5316Z" fill="#91D7EC" />
                <path id="Vector_653" d="M18.8439 52.5589C18.7358 52.5899 18.6753 52.703 18.7064 52.8087C18.7376 52.9163 18.8512 52.9765 18.9576 52.9455C19.0657 52.9145 19.1262 52.8015 19.0951 52.6957C19.0639 52.5881 18.9502 52.5279 18.8439 52.5589Z" fill="#91D7EC" />
                <path id="Vector_654" d="M17.5695 52.9328C17.4613 52.9638 17.4008 53.0768 17.432 53.1826C17.4632 53.2902 17.5768 53.3504 17.6832 53.3194C17.7913 53.2884 17.8518 53.1753 17.8207 53.0695C17.7895 52.9619 17.6758 52.9018 17.5695 52.9328Z" fill="#91D7EC" />
                <path id="Vector_655" d="M26.8731 50.15C26.9097 50.1573 26.9482 50.1591 26.9867 50.1445C27.0912 50.1062 27.1444 49.9895 27.1059 49.8856C27.0674 49.7816 26.9501 49.7287 26.8456 49.767C26.7411 49.8053 26.6879 49.922 26.7264 50.026C26.7356 50.0497 26.7484 50.0698 26.7649 50.088C26.8071 50.0953 26.8437 50.1172 26.8749 50.15H26.8731Z" fill="#91D7EC" />
                <path id="Vector_656" d="M25.8611 50.3469C25.8226 50.2466 25.7126 50.1992 25.6118 50.2302C25.6081 50.2302 25.6026 50.2302 25.599 50.232C25.4945 50.2722 25.4431 50.3889 25.4835 50.4928C25.5238 50.5968 25.6411 50.6478 25.7456 50.6077C25.8025 50.5858 25.841 50.5421 25.8611 50.4892C25.8776 50.4454 25.8813 50.3943 25.8611 50.3469Z" fill="#91D7EC" />
                <path id="Vector_657" d="M24.6203 50.8229C24.5781 50.719 24.4608 50.6697 24.3563 50.7117C24.3508 50.7135 24.3471 50.719 24.3416 50.7208C24.2481 50.7682 24.2041 50.8758 24.2445 50.9743C24.2481 50.9816 24.2536 50.987 24.2573 50.9925C24.3068 51.0818 24.4131 51.1238 24.5085 51.0855C24.5855 51.0545 24.6313 50.9834 24.6331 50.9068C24.6331 50.8794 24.6313 50.8503 24.6185 50.8229H24.6203Z" fill="#91D7EC" />
                <path id="Vector_658" d="M23.1227 51.2095C23.1227 51.2095 23.108 51.2204 23.0989 51.2259C23.042 51.2605 23.0072 51.3171 23.0035 51.3809C23.0017 51.4119 23.0035 51.4447 23.0164 51.4757C23.0604 51.5778 23.1795 51.6253 23.2822 51.5815C23.3812 51.5395 23.4288 51.4265 23.3903 51.3262C23.3903 51.3225 23.3903 51.3207 23.3885 51.3171C23.3445 51.215 23.2254 51.1675 23.1227 51.2113V51.2095Z" fill="#91D7EC" />
                <path id="Vector_659" d="M21.9161 51.7292C21.9161 51.7292 21.9014 51.731 21.8959 51.7347C21.7951 51.7821 21.7511 51.9024 21.7969 52.0027C21.8428 52.103 21.9656 52.1468 22.0664 52.1012C22.1672 52.0556 22.2112 51.9334 22.1654 51.8331C22.1471 51.7967 22.1178 51.7693 22.0848 51.7492C22.0353 51.7182 21.9748 51.7109 21.9161 51.731V51.7292Z" fill="#91D7EC" />
                <path id="Vector_660" d="M20.873 52.652C20.972 52.6009 21.0105 52.4787 20.9592 52.3802C20.9079 52.2818 20.785 52.2435 20.686 52.2945C20.5871 52.3456 20.5486 52.4678 20.5999 52.5662C20.6512 52.6647 20.774 52.703 20.873 52.652Z" fill="#91D7EC" />
                <path id="Vector_661" d="M19.4946 52.9145C19.3993 52.9729 19.37 53.0969 19.4286 53.1917C19.4873 53.2865 19.612 53.3157 19.7073 53.2573C19.8026 53.199 19.8319 53.075 19.7733 52.9801C19.7146 52.8853 19.59 52.8561 19.4946 52.9145Z" fill="#91D7EC" />
                <path id="Vector_662" d="M18.3672 53.6093C18.2719 53.6677 18.2425 53.7917 18.3012 53.8865C18.3599 53.9813 18.4845 54.0105 18.5798 53.9522C18.6752 53.8938 18.7045 53.7698 18.6458 53.675C18.5872 53.5801 18.4625 53.551 18.3672 53.6093Z" fill="#91D7EC" />
                <path id="Vector_663" d="M27.4271 49.8473C27.4051 49.7925 27.4087 49.736 27.4326 49.6868C27.3776 49.6467 27.3079 49.6321 27.2401 49.6576C27.1356 49.6977 27.0843 49.8144 27.1246 49.9184C27.1649 50.0223 27.2822 50.0734 27.3867 50.0333C27.4381 50.0132 27.4747 49.9749 27.4967 49.9293C27.4674 49.9074 27.4417 49.8819 27.4271 49.8454V49.8473Z" fill="#91D7EC" />
                <path id="Vector_664" d="M26.1985 50.3506C26.1729 50.2922 26.1802 50.2284 26.2077 50.1755C26.1509 50.1263 26.0721 50.108 25.9969 50.139C25.9804 50.1463 25.9657 50.1573 25.9529 50.1682C25.8832 50.2229 25.8521 50.3159 25.8869 50.4016C25.8961 50.4217 25.9089 50.4381 25.9236 50.4545C25.9786 50.5183 26.0702 50.5439 26.1527 50.511C26.1967 50.4928 26.2297 50.4582 26.2517 50.4199C26.2297 50.4016 26.2114 50.3779 26.1985 50.3506Z" fill="#91D7EC" />
                <path id="Vector_665" d="M24.6586 50.8922C24.6586 50.8922 24.6586 50.905 24.6623 50.9104C24.7081 51.0126 24.8273 51.0581 24.9299 51.0126C24.9684 50.9943 24.9978 50.9651 25.0179 50.9305C25.0069 50.9177 24.9959 50.9068 24.9886 50.8922C24.9556 50.8284 24.9648 50.7573 24.9996 50.7007C24.9721 50.6679 24.9373 50.646 24.8951 50.6369C24.8529 50.626 24.8071 50.626 24.7649 50.646C24.7539 50.6515 24.7448 50.6606 24.7356 50.6661C24.6623 50.7171 24.6293 50.8083 24.6586 50.894V50.8922Z" fill="#91D7EC" />
                <path id="Vector_666" d="M23.8153 51.2769C23.7639 51.1785 23.6429 51.1402 23.5439 51.1894C23.4431 51.2405 23.4046 51.3608 23.4541 51.4611C23.5036 51.5614 23.6264 51.5997 23.7273 51.5505C23.7603 51.534 23.7823 51.5085 23.8024 51.4812C23.7694 51.4137 23.7749 51.3371 23.8153 51.2788V51.2769Z" fill="#91D7EC" />
                <path id="Vector_667" d="M22.5559 52.1395C22.5962 52.1158 22.6219 52.0775 22.6384 52.0374C22.6384 52.0246 22.6457 52.0155 22.6494 52.0027C22.6586 51.9553 22.6531 51.9061 22.6256 51.8623C22.5687 51.7675 22.4441 51.7347 22.3469 51.793C22.2516 51.8496 22.2186 51.9736 22.2772 52.0702C22.3341 52.165 22.4587 52.1979 22.5559 52.1395Z" fill="#91D7EC" />
                <path id="Vector_668" d="M21.4342 52.8015C21.524 52.734 21.5405 52.6082 21.4745 52.5188C21.4067 52.4295 21.2802 52.4131 21.1904 52.4787C21.1006 52.5444 21.0841 52.672 21.1501 52.7614C21.2161 52.8507 21.3444 52.8671 21.4342 52.8015Z" fill="#91D7EC" />
                <path id="Vector_669" d="M20.1051 53.3011C20.0281 53.3813 20.0318 53.509 20.1143 53.5856C20.195 53.6622 20.3233 53.6585 20.4003 53.5764C20.4773 53.4944 20.4736 53.3686 20.3911 53.292C20.3086 53.2154 20.1821 53.219 20.1051 53.3011Z" fill="#91D7EC" />
                <path id="Vector_670" d="M19.194 54.2603C19.117 54.3406 19.1207 54.4682 19.2032 54.5448C19.2857 54.6214 19.4121 54.6177 19.4891 54.5357C19.5661 54.4554 19.5625 54.3278 19.48 54.2512C19.3975 54.1746 19.271 54.1783 19.194 54.2603Z" fill="#91D7EC" />
                <path id="Vector_671" d="M27.5901 49.8874C27.614 49.8728 27.6415 49.8655 27.6671 49.8619C27.6561 49.8473 27.6433 49.8327 27.6341 49.8145C27.5993 49.7306 27.625 49.6394 27.691 49.5847C27.6433 49.5646 27.5883 49.5628 27.537 49.5847C27.4875 49.6048 27.4508 49.6431 27.4306 49.6868C27.4086 49.7361 27.4031 49.7926 27.4251 49.8473C27.4398 49.8838 27.4655 49.9093 27.4948 49.9312C27.504 49.9385 27.515 49.9458 27.5241 49.9512C27.5406 49.9275 27.5608 49.9057 27.5883 49.8892L27.5901 49.8874Z" fill="#91D7EC" />
                <path id="Vector_672" d="M26.4188 50.3396C26.3767 50.2521 26.4078 50.1518 26.483 50.0953C26.4298 50.0661 26.3638 50.057 26.3033 50.0843C26.2667 50.1007 26.241 50.1281 26.2209 50.1591C26.2172 50.1646 26.2135 50.17 26.2099 50.1755C26.1824 50.2284 26.1732 50.2922 26.2007 50.3506C26.2135 50.3779 26.2319 50.4016 26.2539 50.4199C26.3107 50.4691 26.395 50.4855 26.4683 50.4545C26.483 50.4472 26.494 50.4363 26.5068 50.4271C26.472 50.4071 26.4408 50.3797 26.4207 50.3414L26.4188 50.3396Z" fill="#91D7EC" />
                <path id="Vector_673" d="M25.2986 50.646C25.2381 50.5967 25.1537 50.584 25.0804 50.6204C25.0511 50.635 25.0273 50.6587 25.0089 50.6824C25.0053 50.6879 25.0034 50.6934 24.9998 50.697C24.9649 50.7536 24.9558 50.8247 24.9888 50.8885C24.9961 50.9031 25.0089 50.914 25.0181 50.9268C25.0767 50.9961 25.1757 51.0216 25.2601 50.9797C25.2637 50.9779 25.2674 50.9742 25.2711 50.9706C25.2527 50.956 25.2362 50.9377 25.2234 50.9159C25.1702 50.8192 25.2032 50.7007 25.2986 50.6442V50.646Z" fill="#91D7EC" />
                <path id="Vector_674" d="M23.8154 51.2769C23.775 51.3353 23.7677 51.4119 23.8025 51.4794C23.8044 51.483 23.8044 51.4885 23.808 51.4939C23.863 51.5851 23.9785 51.6161 24.072 51.5687C24.0152 51.4794 24.0372 51.359 24.127 51.2988C24.1362 51.2933 24.1454 51.2915 24.1545 51.2861C24.1179 51.2277 24.0555 51.1967 23.9914 51.1931C23.962 51.1931 23.9327 51.1967 23.9034 51.2095C23.896 51.2131 23.8869 51.2131 23.8777 51.2186C23.852 51.2332 23.8319 51.2551 23.8154 51.2788V51.2769Z" fill="#91D7EC" />
                <path id="Vector_675" d="M22.6368 52.0374C22.6294 52.0884 22.6423 52.1413 22.6753 52.1851C22.7413 52.2708 22.8623 52.289 22.9521 52.2288C22.9521 52.1741 22.9686 52.1194 23.0126 52.0775C23.0199 52.0702 23.0291 52.0684 23.0364 52.0611C23.0364 52.0191 23.0254 51.9772 22.9997 51.9425C22.9319 51.8532 22.8054 51.8368 22.7156 51.9024C22.6808 51.9279 22.6606 51.9644 22.6478 52.0027C22.6441 52.0137 22.6386 52.0246 22.6368 52.0374Z" fill="#91D7EC" />
                <path id="Vector_676" d="M21.9183 52.7121C21.8358 52.6355 21.7075 52.641 21.6323 52.7212C21.5553 52.8033 21.5608 52.9309 21.6415 53.0057C21.724 53.0823 21.8523 53.0768 21.9275 52.9966C22.0044 52.9145 21.9989 52.7869 21.9183 52.7121Z" fill="#91D7EC" />
                <path id="Vector_677" d="M20.9702 53.6476C20.8712 53.5947 20.7484 53.6293 20.6952 53.7278C20.642 53.8263 20.6769 53.9485 20.7759 54.0014C20.8749 54.0542 20.9977 54.0196 21.0508 53.9211C21.104 53.8226 21.0692 53.7005 20.9702 53.6476Z" fill="#91D7EC" />
                <path id="Vector_678" d="M20.3325 54.8074C20.2335 54.7545 20.1107 54.7891 20.0575 54.8876C20.0043 54.9861 20.0392 55.1083 20.1382 55.1611C20.2372 55.214 20.36 55.1794 20.4132 55.0809C20.4663 54.9824 20.4315 54.8603 20.3325 54.8074Z" fill="#91D7EC" />
                <path id="Vector_679" d="M27.6359 49.8163C27.6432 49.8345 27.6561 49.8491 27.6689 49.8637C27.6744 49.8637 27.6781 49.8637 27.6836 49.8637C27.6909 49.8235 27.7074 49.7871 27.7386 49.7561C27.7331 49.674 27.7771 49.5938 27.8559 49.5573C27.8687 49.5518 27.8816 49.5518 27.8962 49.5482C27.8486 49.5299 27.7954 49.53 27.7459 49.55C27.7257 49.5591 27.7111 49.5719 27.6964 49.5847C27.6304 49.6412 27.6048 49.7324 27.6396 49.8144L27.6359 49.8163Z" fill="#91D7EC" />
                <path id="Vector_680" d="M26.5505 50.3816C26.5505 50.3816 26.5469 50.3779 26.5469 50.3761C26.4955 50.2777 26.534 50.1555 26.633 50.1044C26.655 50.0935 26.6807 50.0862 26.7045 50.0844C26.6733 50.0661 26.6403 50.0552 26.6055 50.0552C26.5744 50.0552 26.545 50.0588 26.5157 50.0734C26.5029 50.0789 26.4937 50.0898 26.4827 50.0971C26.4075 50.1537 26.3782 50.2539 26.4185 50.3415C26.4369 50.3798 26.468 50.4071 26.5047 50.4272C26.5102 50.4308 26.5139 50.4327 26.5194 50.4363C26.5267 50.4162 26.5377 50.3998 26.5505 50.3834V50.3816Z" fill="#91D7EC" />
                <path id="Vector_681" d="M25.2988 50.646C25.2034 50.7007 25.1704 50.8211 25.2236 50.9177C25.2364 50.9396 25.2529 50.9578 25.2713 50.9724C25.3061 51.0016 25.3483 51.0144 25.3922 51.0162C25.3867 51.0107 25.3794 51.0053 25.3758 50.9998C25.3153 50.905 25.3446 50.781 25.4381 50.7208C25.4747 50.6971 25.5151 50.6916 25.5536 50.6934C25.5041 50.6332 25.4252 50.6077 25.3501 50.6278C25.3336 50.6314 25.3171 50.6351 25.3006 50.6442C25.3006 50.6442 25.2988 50.646 25.2969 50.6478L25.2988 50.646Z" fill="#91D7EC" />
                <path id="Vector_682" d="M24.0719 51.5687C24.0719 51.5687 24.0737 51.576 24.0755 51.5797C24.114 51.6325 24.1727 51.6599 24.2332 51.6617C24.2075 51.5851 24.2295 51.4994 24.2937 51.4447C24.3322 51.4119 24.3817 51.3973 24.4293 51.3991C24.4238 51.3809 24.4183 51.3645 24.4073 51.3481C24.3487 51.266 24.2405 51.2441 24.1525 51.2861C24.1434 51.2897 24.1324 51.2915 24.125 51.2988C24.037 51.3608 24.015 51.4794 24.07 51.5687H24.0719Z" fill="#91D7EC" />
                <path id="Vector_683" d="M22.9521 52.227C22.9521 52.2763 22.9705 52.3237 23.0071 52.362C23.0621 52.4185 23.1446 52.4349 23.2143 52.4112C23.2198 52.382 23.2308 52.3529 23.251 52.3273C23.2766 52.2945 23.3096 52.2763 23.3463 52.2635C23.361 52.1997 23.3463 52.1322 23.2968 52.0812C23.2253 52.0082 23.1153 52.0027 23.0346 52.0611C23.0273 52.0666 23.0181 52.0702 23.0108 52.0775C22.9686 52.1194 22.9485 52.1742 22.9503 52.2289L22.9521 52.227Z" fill="#91D7EC" />
                <path id="Vector_684" d="M22.3086 52.9692C22.2151 52.909 22.0887 52.9364 22.0282 53.0312C21.9677 53.1242 21.9952 53.25 22.0905 53.3102C22.1858 53.3704 22.3105 53.343 22.371 53.2482C22.4315 53.1552 22.404 53.0294 22.3086 52.9692Z" fill="#91D7EC" />
                <path id="Vector_685" d="M21.5351 54.0579C21.4269 54.0305 21.3169 54.0944 21.2876 54.202C21.2601 54.3096 21.3243 54.419 21.4324 54.4481C21.5406 54.4755 21.6506 54.4117 21.6799 54.3041C21.7093 54.1965 21.6433 54.0871 21.5351 54.0579Z" fill="#91D7EC" />
                <path id="Vector_686" d="M21.2032 55.3362C21.095 55.3089 20.985 55.3727 20.9557 55.4803C20.9264 55.5879 20.9924 55.6973 21.1005 55.7265C21.2087 55.7556 21.3187 55.69 21.348 55.5824C21.3755 55.4748 21.3114 55.3654 21.2032 55.3362Z" fill="#91D7EC" />
                <path id="Vector_687" d="M27.7367 49.7561C27.7367 49.7561 27.755 49.7397 27.7642 49.7342C27.7807 49.6831 27.8155 49.6376 27.8687 49.612C27.964 49.5664 28.0758 49.6029 28.129 49.6923C28.1253 49.6813 28.1271 49.6704 28.1216 49.6594C28.0813 49.5701 27.986 49.5281 27.8925 49.55C27.8797 49.5537 27.865 49.5537 27.8522 49.5591C27.7733 49.5956 27.7293 49.6758 27.7348 49.7579L27.7367 49.7561Z" fill="#91D7EC" />
                <path id="Vector_688" d="M26.5452 50.3761C26.5452 50.3761 26.5489 50.3797 26.5489 50.3816C26.5525 50.3779 26.5562 50.3743 26.5599 50.3706C26.5599 50.2995 26.5929 50.2284 26.6589 50.1901C26.7505 50.1372 26.8623 50.1664 26.9228 50.2484C26.9192 50.2284 26.9155 50.2083 26.9063 50.1883C26.8972 50.1719 26.8843 50.1609 26.8733 50.1482C26.844 50.1153 26.8055 50.0953 26.7634 50.0861C26.7432 50.0825 26.723 50.0789 26.7029 50.0825C26.679 50.0843 26.6552 50.0916 26.6314 50.1026C26.5324 50.1536 26.4939 50.2758 26.5452 50.3743V50.3761Z" fill="#91D7EC" />
                <path id="Vector_689" d="M25.4377 50.7226C25.3423 50.7828 25.3148 50.9068 25.3753 51.0016C25.379 51.0089 25.3863 51.0126 25.3918 51.018C25.3973 51.0253 25.4047 51.0308 25.4102 51.0381C25.4065 50.9724 25.4303 50.905 25.489 50.863C25.5696 50.8047 25.676 50.8156 25.7456 50.8813C25.7438 50.8484 25.7365 50.8156 25.7181 50.7846C25.6815 50.7263 25.6191 50.6971 25.555 50.6953C25.5147 50.6953 25.4743 50.7007 25.4395 50.7226H25.4377Z" fill="#91D7EC" />
                <path id="Vector_690" d="M24.2355 51.6617C24.2428 51.6854 24.2556 51.7091 24.2721 51.7292C24.2923 51.7529 24.3179 51.7693 24.3436 51.7821C24.3491 51.7419 24.3638 51.7018 24.3931 51.6708C24.4536 51.607 24.5471 51.5942 24.6241 51.6289C24.6314 51.5742 24.6186 51.5158 24.5801 51.4702C24.5416 51.4246 24.4866 51.4028 24.4298 51.4009C24.3821 51.4009 24.3344 51.4137 24.2941 51.4465C24.23 51.5012 24.208 51.5869 24.2336 51.6635L24.2355 51.6617Z" fill="#91D7EC" />
                <path id="Vector_691" d="M23.2161 52.4112C23.2014 52.4842 23.2253 52.5608 23.2876 52.61C23.3426 52.6519 23.4104 52.6592 23.4728 52.6392C23.5003 52.6063 23.5351 52.5808 23.5736 52.5699C23.6396 52.4823 23.6231 52.3583 23.5369 52.2909C23.4801 52.2471 23.4104 52.2416 23.3481 52.2617C23.3114 52.2745 23.2784 52.2927 23.2528 52.3255C23.2326 52.351 23.2216 52.3802 23.2161 52.4094V52.4112Z" fill="#91D7EC" />
                <path id="Vector_692" d="M22.7835 53.5674C22.8238 53.4634 22.7725 53.3467 22.668 53.3066C22.5635 53.2665 22.4462 53.3175 22.4058 53.4215C22.3655 53.5254 22.4168 53.6421 22.5213 53.6822C22.6258 53.7224 22.7432 53.6713 22.7835 53.5674Z" fill="#91D7EC" />
                <path id="Vector_693" d="M22.1125 54.5193C22.0007 54.5193 21.9091 54.6068 21.9072 54.7181C21.9072 54.8293 21.9952 54.9205 22.107 54.9223C22.2189 54.9223 22.3105 54.8348 22.3124 54.7235C22.3124 54.6123 22.2244 54.5211 22.1125 54.5193Z" fill="#91D7EC" />
                <path id="Vector_694" d="M22.092 55.8414C21.9802 55.8414 21.8886 55.9289 21.8867 56.0401C21.8867 56.1514 21.9747 56.2426 22.0865 56.2444C22.1984 56.2444 22.29 56.1568 22.2919 56.0456C22.2919 55.9344 22.2039 55.8432 22.092 55.8414Z" fill="#91D7EC" />
                <path id="Vector_695" d="M28.129 49.6923C28.0758 49.6029 27.964 49.5664 27.8687 49.612C27.8155 49.6375 27.7807 49.6831 27.7642 49.7342C27.7715 49.7287 27.777 49.7214 27.7843 49.7178C27.8833 49.6667 28.0061 49.7032 28.0575 49.8017C28.0831 49.8509 28.0868 49.9056 28.0721 49.953C28.151 49.8965 28.1821 49.7944 28.1381 49.705C28.1363 49.6996 28.1308 49.6959 28.1271 49.6923H28.129Z" fill="#91D7EC" />
                <path id="Vector_696" d="M26.6586 50.1901C26.5926 50.2284 26.5578 50.2977 26.5596 50.3706C26.5706 50.3597 26.578 50.3487 26.5908 50.3396C26.6843 50.2794 26.8108 50.305 26.8713 50.398C26.886 50.4217 26.8951 50.4454 26.9006 50.4709C26.9098 50.4673 26.9208 50.4709 26.9299 50.4673C26.9666 50.4071 26.9739 50.3287 26.9354 50.263C26.9318 50.2576 26.9263 50.2539 26.9226 50.2484C26.8621 50.1664 26.7503 50.1372 26.6586 50.1901Z" fill="#91D7EC" />
                <path id="Vector_697" d="M25.4893 50.863C25.4325 50.9049 25.4068 50.9724 25.4105 51.0381C25.4105 51.0636 25.4197 51.0891 25.4307 51.1128C25.438 51.1019 25.4435 51.0909 25.4545 51.0818C25.5388 51.0089 25.6672 51.0162 25.7405 51.1001C25.7533 51.1146 25.7606 51.1311 25.768 51.1475C25.8211 51.0782 25.8266 50.9815 25.7716 50.9086C25.7643 50.8976 25.7533 50.8922 25.7441 50.8849C25.6745 50.8192 25.5682 50.8083 25.4875 50.8666L25.4893 50.863Z" fill="#91D7EC" />
                <path id="Vector_698" d="M24.3946 51.669C24.3634 51.7 24.3506 51.7401 24.3451 51.7803C24.3359 51.8423 24.3542 51.9079 24.4019 51.9535C24.4129 51.9644 24.4276 51.9699 24.4404 51.9772C24.5027 51.9006 24.6109 51.8824 24.6952 51.9316C24.7612 51.8514 24.7575 51.7329 24.6787 51.6599C24.6622 51.6435 24.642 51.6344 24.6237 51.6253C24.5467 51.5906 24.455 51.6034 24.3927 51.6672L24.3946 51.669Z" fill="#91D7EC" />
                <path id="Vector_699" d="M23.4725 52.6392C23.4652 52.6483 23.4542 52.6556 23.4487 52.6665C23.3955 52.7632 23.4303 52.8872 23.5275 52.94C23.6247 52.9929 23.7493 52.9583 23.8025 52.8616C23.8557 52.765 23.8208 52.641 23.7237 52.5881C23.676 52.5626 23.6228 52.5571 23.5733 52.5699C23.533 52.5808 23.5 52.6063 23.4725 52.6392Z" fill="#91D7EC" />
                <path id="Vector_700" d="M23.0198 53.7242C22.9098 53.7059 22.8053 53.7789 22.787 53.8901C22.7687 54.0013 22.842 54.1035 22.9538 54.1217C23.0656 54.1399 23.1683 54.067 23.1866 53.9558C23.205 53.8445 23.1316 53.7424 23.0198 53.7242Z" fill="#91D7EC" />
                <path id="Vector_701" d="M22.7208 55.0281C22.6108 55.0518 22.5429 55.1593 22.5668 55.2688C22.5906 55.3782 22.6988 55.4457 22.8088 55.4219C22.9188 55.3982 22.9866 55.2906 22.9628 55.1812C22.9389 55.0718 22.8308 55.0043 22.7208 55.0281Z" fill="#91D7EC" />
                <path id="Vector_702" d="M23.0049 56.3191C22.895 56.3428 22.8271 56.4504 22.851 56.5598C22.8748 56.6693 22.9829 56.7367 23.0929 56.713C23.2029 56.6893 23.2708 56.5817 23.2469 56.4723C23.2231 56.3629 23.1149 56.2954 23.0049 56.3191Z" fill="#91D7EC" />
                <path id="Vector_703" d="M28.0594 49.8017C28.0081 49.7032 27.8853 49.6649 27.7863 49.7178C27.7789 49.7214 27.7734 49.7287 27.7661 49.7342C27.7569 49.7415 27.7459 49.7488 27.7386 49.7561C27.7093 49.7853 27.6909 49.8236 27.6836 49.8637C27.7569 49.86 27.8303 49.8929 27.8688 49.9603C27.8944 50.0023 27.8981 50.0515 27.8907 50.0953C27.9182 50.0953 27.9476 50.088 27.9732 50.0734C28.0227 50.0479 28.0576 50.0023 28.0722 49.953C28.0869 49.9038 28.0832 49.8491 28.0576 49.8017H28.0594Z" fill="#91D7EC" />
                <path id="Vector_704" d="M26.8291 50.511C26.8511 50.4928 26.875 50.48 26.9006 50.4727C26.8951 50.4472 26.886 50.4217 26.8713 50.3998C26.8108 50.3068 26.6843 50.2794 26.5908 50.3414C26.578 50.3506 26.5707 50.3615 26.5597 50.3724C26.556 50.3761 26.5523 50.3797 26.5487 50.3834C26.534 50.3998 26.5248 50.418 26.5175 50.4363C26.5047 50.4691 26.4973 50.5019 26.5028 50.5366C26.578 50.5201 26.6586 50.5457 26.7081 50.6095C26.7301 50.6387 26.7411 50.6715 26.7448 50.7062C26.7503 50.7062 26.7558 50.7025 26.7595 50.7007C26.7485 50.6314 26.7705 50.5603 26.8273 50.5129L26.8291 50.511Z" fill="#91D7EC" />
                <path id="Vector_705" d="M25.4561 51.08C25.4451 51.0891 25.4396 51.1019 25.4322 51.111C25.3809 51.1803 25.3772 51.2715 25.4267 51.3426C25.4946 51.3189 25.5716 51.3298 25.6284 51.3809C25.6412 51.3918 25.6486 51.4064 25.6577 51.421C25.6816 51.4119 25.7054 51.3991 25.7256 51.3827C25.7952 51.3207 25.8099 51.2241 25.7696 51.1456C25.7622 51.1292 25.7549 51.1128 25.7421 51.0982C25.6687 51.0143 25.5404 51.007 25.4561 51.08Z" fill="#91D7EC" />
                <path id="Vector_706" d="M24.4405 51.979C24.4405 51.979 24.4332 51.9845 24.4314 51.9881C24.3654 52.0775 24.3855 52.2051 24.4772 52.269C24.5688 52.3328 24.6953 52.3145 24.7595 52.2234C24.8237 52.1322 24.8053 52.0064 24.7137 51.9425C24.7082 51.9389 24.7008 51.9371 24.6953 51.9352C24.6092 51.886 24.5029 51.9042 24.4405 51.9808V51.979Z" fill="#91D7EC" />
                <path id="Vector_707" d="M24.0114 53.2409C24.0463 53.1352 23.9894 53.0203 23.8831 52.9856C23.7768 52.951 23.6613 53.0075 23.6264 53.1133C23.5916 53.2191 23.6484 53.3339 23.7548 53.3686C23.8611 53.4032 23.9766 53.3467 24.0114 53.2409Z" fill="#91D7EC" />
                <path id="Vector_708" d="M23.4102 54.6323C23.522 54.6268 23.6082 54.532 23.6027 54.4208C23.5972 54.3095 23.5018 54.2238 23.39 54.2293C23.2782 54.2348 23.192 54.3296 23.1975 54.4408C23.203 54.5521 23.2983 54.6378 23.4102 54.6323Z" fill="#91D7EC" />
                <path id="Vector_709" d="M23.3826 55.5678C23.2817 55.6152 23.2359 55.7338 23.2836 55.8359C23.3312 55.9362 23.4504 55.9818 23.553 55.9344C23.6539 55.887 23.6997 55.7684 23.652 55.6663C23.6044 55.566 23.4852 55.5204 23.3826 55.5678Z" fill="#91D7EC" />
                <path id="Vector_710" d="M24.1108 57.1324C24.2116 57.085 24.2574 56.9665 24.2097 56.8644C24.1694 56.7787 24.0778 56.7385 23.9879 56.755C23.9769 56.7914 23.9586 56.8242 23.9274 56.8516C23.8999 56.8753 23.8669 56.8862 23.8321 56.8917C23.8193 56.9373 23.8193 56.9865 23.8394 57.034C23.8871 57.1343 24.0063 57.1798 24.1089 57.1324H24.1108Z" fill="#91D7EC" />
                <path id="Vector_711" d="M27.8687 49.9603C27.8283 49.8929 27.7568 49.86 27.6835 49.8637C27.678 49.8637 27.6743 49.8637 27.6688 49.8637C27.6413 49.8673 27.6157 49.8746 27.5918 49.8892C27.5643 49.9056 27.5442 49.9275 27.5277 49.9512C27.4873 50.0114 27.4818 50.0898 27.5167 50.1573C27.5313 50.17 27.5478 50.181 27.5588 50.1974C27.5625 50.2029 27.5643 50.2102 27.568 50.2175C27.6322 50.2703 27.722 50.2813 27.799 50.2375C27.8522 50.2065 27.8833 50.1536 27.8943 50.0971C27.9017 50.0515 27.898 50.0041 27.8723 49.9622L27.8687 49.9603Z" fill="#91D7EC" />
                <path id="Vector_712" d="M26.5027 50.5348C26.4752 50.5402 26.4477 50.5512 26.4239 50.5694C26.3341 50.6369 26.3176 50.7627 26.3854 50.8521C26.4532 50.9414 26.5797 50.9578 26.6696 50.8903C26.7301 50.8448 26.7539 50.7736 26.7447 50.7043C26.7411 50.6697 26.7301 50.6369 26.7081 50.6077C26.6586 50.5439 26.5779 50.5183 26.5027 50.5348Z" fill="#91D7EC" />
                <path id="Vector_713" d="M25.4267 51.3445C25.3956 51.3554 25.3663 51.3718 25.3424 51.3973C25.2673 51.4794 25.2746 51.607 25.3589 51.6818C25.4432 51.7566 25.5697 51.7493 25.6449 51.6654C25.7072 51.5961 25.7091 51.4958 25.6596 51.421C25.6504 51.4083 25.6431 51.3937 25.6302 51.3809C25.5734 51.3299 25.4964 51.3207 25.4286 51.3426L25.4267 51.3445Z" fill="#91D7EC" />
                <path id="Vector_714" d="M24.5156 52.6957C24.6164 52.7449 24.7374 52.7048 24.7869 52.6045C24.8364 52.5042 24.7961 52.3838 24.6953 52.3346C24.5944 52.2854 24.4734 52.3255 24.4239 52.4258C24.3744 52.5261 24.4148 52.6464 24.5156 52.6957Z" fill="#91D7EC" />
                <path id="Vector_715" d="M23.9935 53.8992C24.1053 53.912 24.2043 53.8318 24.2172 53.7205C24.23 53.6093 24.1493 53.5108 24.0375 53.498C23.9257 53.4853 23.8267 53.5655 23.8138 53.6768C23.801 53.788 23.8817 53.8865 23.9935 53.8992Z" fill="#91D7EC" />
                <path id="Vector_716" d="M24.0647 54.9569C24.0354 54.8494 23.9236 54.7874 23.8154 54.8165C23.7072 54.8457 23.6449 54.9569 23.6742 55.0645C23.7036 55.1721 23.8154 55.2341 23.9236 55.2049C24.0317 55.1758 24.094 55.0645 24.0647 54.9569Z" fill="#91D7EC" />
                <path id="Vector_717" d="M24.1071 56.1222C24.0173 56.1878 23.9989 56.3155 24.0649 56.4048C24.1309 56.4942 24.2593 56.5124 24.3491 56.4468C24.4389 56.3811 24.4572 56.2535 24.3912 56.1641C24.3253 56.0747 24.1969 56.0565 24.1071 56.1222Z" fill="#91D7EC" />
                <path id="Vector_718" d="M24.9411 57.1708C24.9411 57.1708 24.9375 57.1671 24.9356 57.1653C24.9228 57.1708 24.91 57.1744 24.8971 57.1835C24.8073 57.2492 24.789 57.3768 24.855 57.4662C24.921 57.5555 25.0493 57.5738 25.1391 57.5081C25.229 57.4425 25.2473 57.3148 25.1813 57.2255C25.174 57.2145 25.1611 57.2072 25.152 57.1999C25.0841 57.2309 25.0016 57.2236 24.9411 57.1726V57.1708Z" fill="#91D7EC" />
                <path id="Vector_719" d="M27.5148 50.1555C27.447 50.1008 27.3517 50.0917 27.2747 50.1427C27.1812 50.2047 27.1574 50.3305 27.2197 50.4235C27.282 50.5165 27.4085 50.5402 27.502 50.4782C27.5882 50.4199 27.612 50.3087 27.5643 50.2175C27.5607 50.2102 27.5607 50.2029 27.5552 50.1974C27.5442 50.181 27.5277 50.1682 27.513 50.1573L27.5148 50.1555Z" fill="#91D7EC" />
                <path id="Vector_720" d="M26.2354 51.0435C26.3014 50.9724 26.4059 50.9633 26.4865 51.0107C26.4792 50.9761 26.4663 50.9414 26.4389 50.9141C26.3619 50.832 26.2335 50.8284 26.1529 50.9049C26.0704 50.9815 26.0667 51.1092 26.1437 51.1894C26.1565 51.204 26.173 51.2131 26.1895 51.2222C26.1767 51.1602 26.1895 51.0928 26.2354 51.0435Z" fill="#91D7EC" />
                <path id="Vector_721" d="M25.3023 52.0556C25.3371 51.9882 25.4049 51.9535 25.4746 51.9499C25.4691 51.9134 25.4746 51.8769 25.4911 51.8405C25.4764 51.8186 25.4581 51.7985 25.4343 51.7839C25.3408 51.7238 25.2143 51.7493 25.1538 51.8423C25.0933 51.9353 25.119 52.0611 25.2125 52.1213C25.2345 52.1359 25.2583 52.145 25.2821 52.1486C25.2821 52.1158 25.2858 52.0848 25.3023 52.0538V52.0556Z" fill="#91D7EC" />
                <path id="Vector_722" d="M24.6717 52.9637C24.6791 52.9364 24.6901 52.9127 24.7047 52.8926C24.6864 52.8799 24.6681 52.8689 24.6461 52.8634C24.5379 52.8343 24.4261 52.8999 24.3986 53.0075C24.3692 53.1151 24.4352 53.2263 24.5434 53.2537C24.5947 53.2665 24.6461 53.2592 24.6901 53.2355C24.7029 53.2099 24.7194 53.1862 24.7414 53.168C24.6827 53.1206 24.6534 53.0422 24.6717 52.9656V52.9637Z" fill="#91D7EC" />
                <path id="Vector_723" d="M24.3854 54.1837C24.3433 54.1491 24.2901 54.129 24.2314 54.1363C24.1196 54.1491 24.0408 54.2494 24.0536 54.3606C24.0554 54.377 24.0628 54.3916 24.0683 54.4062C24.0774 54.4026 24.0848 54.3971 24.0939 54.3971C24.1911 54.3789 24.2828 54.4372 24.3158 54.5266C24.3598 54.512 24.3964 54.4864 24.4203 54.4481C24.3836 54.4171 24.3579 54.3752 24.3506 54.3241C24.3433 54.2731 24.3579 54.2239 24.3854 54.1856V54.1837Z" fill="#91D7EC" />
                <path id="Vector_724" d="M24.5596 55.5149C24.4991 55.4475 24.3982 55.4238 24.3157 55.4694C24.2167 55.5222 24.1801 55.6444 24.2351 55.7429C24.2351 55.7429 24.2351 55.7429 24.2369 55.7447C24.2461 55.7356 24.2534 55.7265 24.2644 55.7192C24.3597 55.6608 24.4844 55.69 24.5431 55.7848C24.5431 55.7867 24.5431 55.7903 24.5467 55.794C24.5651 55.7775 24.5797 55.7593 24.5907 55.7374C24.5816 55.7265 24.5706 55.7174 24.5614 55.7046C24.5266 55.6444 24.5302 55.5733 24.5614 55.5149H24.5596Z" fill="#91D7EC" />
                <path id="Vector_725" d="M24.9152 56.8862C24.9867 56.8005 25.115 56.7877 25.2012 56.8589C25.2122 56.868 25.2195 56.8808 25.2287 56.8917C25.2324 56.8862 25.236 56.8808 25.2397 56.8735C25.1957 56.8188 25.1829 56.7476 25.2049 56.6838C25.1975 56.6747 25.1939 56.6656 25.1847 56.6583C25.1022 56.5835 24.9739 56.589 24.8987 56.671C24.8382 56.7367 24.8327 56.8279 24.8731 56.9026C24.8786 56.9118 24.8859 56.9209 24.8932 56.93C24.9006 56.9154 24.9061 56.899 24.9171 56.8844L24.9152 56.8862Z" fill="#91D7EC" />
                <path id="Vector_726" d="M26.1783 57.6741C26.1783 57.6741 26.1874 57.6814 26.1948 57.685C26.1856 57.654 26.1856 57.6212 26.1929 57.5884C26.1838 57.5756 26.1764 57.561 26.1636 57.5501C26.0811 57.4753 25.9528 57.4808 25.8776 57.5628C25.8025 57.6449 25.8079 57.7725 25.8904 57.8473C25.8904 57.8218 25.8978 57.7962 25.9088 57.7725C25.9564 57.6722 26.0756 57.6267 26.1783 57.6741Z" fill="#91D7EC" />
                <path id="Vector_727" d="M26.9303 50.4709C26.9212 50.4709 26.9102 50.4709 26.901 50.4746C26.8753 50.4819 26.8515 50.4946 26.8295 50.5129C26.7708 50.5603 26.7507 50.6332 26.7617 50.7007C26.7672 50.7353 26.7782 50.7682 26.802 50.7955C26.8735 50.8812 27 50.894 27.088 50.8229C27.1741 50.7518 27.187 50.6259 27.1155 50.5384C27.0696 50.4819 26.9981 50.4618 26.9322 50.4709H26.9303Z" fill="#91D7EC" />
                <path id="Vector_728" d="M25.7732 51.379C25.7035 51.4666 25.7164 51.5924 25.8044 51.6617C25.8924 51.731 26.0189 51.7182 26.0885 51.6307C26.1582 51.5432 26.1453 51.4173 26.0574 51.348C25.9694 51.2787 25.8429 51.2915 25.7732 51.379Z" fill="#91D7EC" />
                <path id="Vector_729" d="M25.1757 52.3492C25.0712 52.3073 24.9539 52.3584 24.9118 52.4605C24.8696 52.5644 24.9209 52.6811 25.0236 52.7231C25.1281 52.765 25.2454 52.714 25.2876 52.6118C25.3297 52.5079 25.2784 52.3912 25.1757 52.3492Z" fill="#91D7EC" />
                <path id="Vector_730" d="M24.807 53.7643C24.8089 53.6531 24.7209 53.5601 24.609 53.5583C24.4972 53.5564 24.4037 53.644 24.4019 53.7552C24.4001 53.8664 24.488 53.9594 24.5999 53.9613C24.7117 53.9631 24.8052 53.8756 24.807 53.7643Z" fill="#91D7EC" />
                <path id="Vector_731" d="M24.5049 54.8931C24.4004 54.9332 24.3472 55.0499 24.3875 55.1538C24.4279 55.2578 24.5452 55.3107 24.6497 55.2706C24.7542 55.2304 24.8073 55.1137 24.767 55.0098C24.7267 54.9058 24.6093 54.853 24.5049 54.8931Z" fill="#91D7EC" />
                <path id="Vector_732" d="M24.9174 56.1623C24.833 56.2353 24.8239 56.3629 24.8972 56.4468C24.9705 56.5307 25.0989 56.5398 25.1832 56.4669C25.2675 56.3939 25.2767 56.2663 25.2034 56.1824C25.13 56.0985 25.0017 56.0894 24.9174 56.1623Z" fill="#91D7EC" />
                <path id="Vector_733" d="M26.0319 57.1397C26.0063 57.1233 25.9769 57.116 25.9494 57.1124C25.9054 57.1671 25.8394 57.189 25.7734 57.1835C25.7679 57.1908 25.7588 57.1962 25.7533 57.2035C25.7496 57.209 25.7496 57.2163 25.746 57.2218C25.7001 57.313 25.7276 57.426 25.8174 57.4807C25.9128 57.5391 26.0374 57.5117 26.0961 57.4169C26.1108 57.3932 26.1199 57.3695 26.1236 57.344C26.1364 57.2655 26.1034 57.1835 26.0319 57.1379V57.1397Z" fill="#91D7EC" />
                <path id="Vector_734" d="M26.8511 57.9749C26.8364 58.0533 26.8694 58.1372 26.9409 58.1828C27.0362 58.2412 27.1609 58.2138 27.2196 58.119C27.2782 58.0242 27.2507 57.9002 27.1554 57.8418C27.1224 57.8217 27.0876 57.8145 27.0509 57.8145C27.0491 57.8272 27.0491 57.84 27.0436 57.8527C27.0106 57.933 26.9317 57.9786 26.8492 57.9749H26.8511Z" fill="#91D7EC" />
                <path id="Vector_735" d="M26.4863 51.0107C26.4056 50.9633 26.3011 50.9724 26.2351 51.0435C26.1893 51.0928 26.1764 51.1602 26.1893 51.2222C26.1984 51.2605 26.2149 51.2988 26.2461 51.328C26.3286 51.4028 26.4569 51.3991 26.5321 51.3171C26.6072 51.235 26.6036 51.1073 26.5211 51.0326C26.5101 51.0235 26.4973 51.018 26.4863 51.0107Z" fill="#91D7EC" />
                <path id="Vector_736" d="M25.5682 52.0957C25.5132 52.0629 25.4839 52.0082 25.4747 51.9517C25.4051 51.9535 25.3372 51.99 25.3024 52.0574C25.2859 52.0884 25.2822 52.1194 25.2822 52.1522C25.2822 52.2234 25.3207 52.2945 25.3886 52.3291C25.4875 52.3802 25.6104 52.3419 25.6617 52.2434C25.6819 52.2051 25.6855 52.1632 25.6782 52.1213C25.6397 52.1213 25.603 52.1176 25.5682 52.0957Z" fill="#91D7EC" />
                <path id="Vector_737" d="M24.9447 53.25C24.9136 53.2427 24.8861 53.2282 24.8622 53.2099C24.8476 53.2099 24.8347 53.2099 24.8201 53.2099C24.7889 53.2026 24.7633 53.188 24.7413 53.1698C24.7193 53.188 24.7028 53.2117 24.6899 53.2373C24.6808 53.2555 24.6716 53.2756 24.6698 53.2956C24.6551 53.4069 24.7321 53.5072 24.8439 53.5217C24.9557 53.5363 25.0566 53.4597 25.0712 53.3485C25.0767 53.3102 25.0676 53.2756 25.0529 53.2409C25.0199 53.2519 24.9832 53.2592 24.9466 53.25H24.9447Z" fill="#91D7EC" />
                <path id="Vector_738" d="M24.5781 54.4955C24.5689 54.4955 24.5597 54.4955 24.5487 54.4955C24.5029 54.5448 24.4791 54.6123 24.4974 54.6815C24.5249 54.7891 24.6349 54.8548 24.7449 54.8274C24.8531 54.8001 24.9191 54.6907 24.8916 54.5813C24.8824 54.5466 24.8641 54.5193 24.8421 54.4955C24.8146 54.5193 24.7834 54.5393 24.7449 54.5448C24.6826 54.5557 24.6239 54.5338 24.5799 54.4955H24.5781Z" fill="#91D7EC" />
                <path id="Vector_739" d="M25.1408 56.0729C25.2325 56.0091 25.2526 55.8833 25.1885 55.7921C25.1683 55.7648 25.1426 55.7447 25.1133 55.7319C25.0968 55.7666 25.0748 55.7976 25.0382 55.8195C24.9758 55.8578 24.9025 55.8541 24.842 55.8231C24.8108 55.8869 24.8127 55.9635 24.8567 56.0255C24.9208 56.1167 25.0473 56.1368 25.139 56.0729H25.1408Z" fill="#91D7EC" />
                <path id="Vector_740" d="M25.5936 56.972C25.59 57.0376 25.6138 57.1051 25.6706 57.147C25.7018 57.1689 25.7366 57.1798 25.7714 57.1817C25.8374 57.189 25.9034 57.1653 25.9474 57.1106C25.9493 57.1087 25.9529 57.1069 25.9548 57.1051C26.0208 57.0157 26.0024 56.8899 25.9126 56.8224C25.8851 56.8024 25.8539 56.7914 25.8209 56.7878C25.8191 56.8297 25.8063 56.8698 25.7769 56.9045C25.7293 56.9592 25.6596 56.9811 25.5936 56.9701V56.972Z" fill="#91D7EC" />
                <path id="Vector_741" d="M26.8547 57.5738C26.8547 57.5738 26.8401 57.5774 26.8327 57.5774C26.8437 57.6212 26.8437 57.6686 26.8217 57.7142C26.7906 57.778 26.7301 57.8145 26.6641 57.8236C26.6787 57.882 26.7172 57.9348 26.7796 57.9604C26.8034 57.9695 26.8272 57.9731 26.8511 57.975C26.9335 57.9786 27.0124 57.933 27.0454 57.8528C27.0509 57.84 27.0509 57.8272 27.0527 57.8145C27.0692 57.7306 27.0325 57.6449 26.9555 57.6011C26.9482 57.5975 26.9427 57.592 26.9354 57.5884C26.9079 57.5774 26.8804 57.5719 26.8547 57.5738Z" fill="#91D7EC" />
                <path id="Vector_742" d="M28.0356 58.2412C28.0191 58.3087 27.9677 58.3561 27.9072 58.3779C27.9292 58.4181 27.9604 58.4509 28.0044 58.4709C28.107 58.5147 28.2262 58.4655 28.2702 58.3634C28.3142 58.2612 28.2647 58.1427 28.162 58.0989C28.1144 58.0789 28.0631 58.0807 28.0172 58.0971C28.0411 58.1409 28.0502 58.1919 28.0374 58.243L28.0356 58.2412Z" fill="#91D7EC" />
                <path id="Vector_743" d="M25.7768 51.7493C25.6815 51.6909 25.5568 51.7219 25.4982 51.8185C25.4945 51.8258 25.4927 51.835 25.489 51.8423C25.4725 51.8769 25.4688 51.9152 25.4725 51.9517C25.4817 52.01 25.511 52.0647 25.566 52.0957C25.6008 52.1158 25.6393 52.1213 25.676 52.1213C25.742 52.1194 25.8061 52.0884 25.8428 52.0283C25.9015 51.9334 25.8703 51.8094 25.7731 51.7511L25.7768 51.7493Z" fill="#91D7EC" />
                <path id="Vector_744" d="M25.1869 53.095C25.2107 52.9856 25.1411 52.8799 25.0311 52.8562C25.0182 52.8543 25.0072 52.8562 24.9944 52.8562C25.0531 52.9036 25.0842 52.982 25.0659 53.0604C25.0421 53.1534 24.9578 53.2118 24.8643 53.2099C24.8881 53.2282 24.9156 53.2446 24.9468 53.25C24.9834 53.2573 25.0201 53.2519 25.0531 53.2409C25.1172 53.219 25.1722 53.168 25.1869 53.095Z" fill="#91D7EC" />
                <path id="Vector_745" d="M24.908 54.3114C24.8897 54.2056 24.7907 54.1345 24.6843 54.1472C24.7192 54.1782 24.7448 54.2184 24.7522 54.2676C24.7668 54.377 24.6898 54.4791 24.5798 54.4955C24.5798 54.4955 24.578 54.4955 24.5762 54.4955C24.6202 54.5338 24.6788 54.5557 24.7412 54.5448C24.7797 54.5375 24.8108 54.5192 24.8383 54.4955C24.8897 54.4499 24.919 54.3843 24.9062 54.3132L24.908 54.3114Z" fill="#91D7EC" />
                <path id="Vector_746" d="M25.04 55.8176C25.0748 55.7958 25.0986 55.7648 25.1151 55.7301C25.1426 55.6718 25.1445 55.6006 25.1078 55.5405C25.0583 55.4584 24.9593 55.4292 24.8731 55.4566C24.8878 55.4712 24.9043 55.4839 24.9135 55.504C24.9685 55.6006 24.9355 55.7246 24.8365 55.7793C24.8255 55.7866 24.8108 55.7866 24.7998 55.7921C24.8126 55.8049 24.8273 55.814 24.8438 55.8231C24.9043 55.8541 24.9776 55.8559 25.04 55.8195V55.8176Z" fill="#91D7EC" />
                <path id="Vector_747" d="M25.5443 56.8863C25.5278 56.9045 25.5094 56.9155 25.4893 56.9264C25.4893 56.9264 25.4893 56.9282 25.4911 56.93C25.5204 56.9556 25.5571 56.9665 25.5919 56.972C25.6598 56.9811 25.7294 56.961 25.7752 56.9063C25.8046 56.8717 25.8156 56.8316 25.8192 56.7896C25.8229 56.7276 25.8027 56.6656 25.7514 56.6219C25.6854 56.5671 25.5938 56.5617 25.5223 56.6018C25.6066 56.6747 25.6139 56.8024 25.5406 56.8863H25.5443Z" fill="#91D7EC" />
                <path id="Vector_748" d="M26.8221 57.7142C26.8441 57.6704 26.8441 57.623 26.8331 57.5774C26.8331 57.5738 26.8331 57.5701 26.8331 57.5665C26.8166 57.5154 26.78 57.4698 26.7286 57.4461C26.6572 57.4115 26.5765 57.4261 26.5178 57.4716C26.5178 57.4716 26.516 57.4716 26.5142 57.4735C26.5875 57.5318 26.615 57.6303 26.571 57.7178C26.5582 57.7434 26.5398 57.7652 26.5178 57.7835C26.5307 57.7926 26.5398 57.8035 26.5545 57.8108C26.5912 57.8272 26.6297 57.8291 26.6682 57.8254C26.7341 57.8163 26.7946 57.7798 26.8258 57.716L26.8221 57.7142Z" fill="#91D7EC" />
                <path id="Vector_749" d="M27.9072 58.3779C27.9677 58.356 28.0191 58.3086 28.0356 58.2412C28.0484 58.1901 28.0392 58.139 28.0154 58.0953C27.9897 58.0479 27.9457 58.0096 27.8889 57.995C27.8174 57.9767 27.7459 58.0023 27.6982 58.0515C27.7624 58.0989 27.7954 58.1828 27.7734 58.2649C27.7642 58.3013 27.7441 58.3287 27.7184 58.3524C27.7386 58.367 27.7624 58.3797 27.7899 58.387C27.8302 58.398 27.8706 58.3907 27.9072 58.3779Z" fill="#91D7EC" />
                <path id="Vector_750" d="M29.3241 58.5657C29.3516 58.4581 29.2857 58.3487 29.1775 58.3214C29.0987 58.3013 29.0217 58.3305 28.9722 58.3888C29.0327 58.429 29.0712 58.5001 29.062 58.5767C29.0565 58.6168 29.0382 58.6514 29.0143 58.6806C29.0345 58.6934 29.0547 58.7061 29.0785 58.7116C29.1867 58.739 29.2967 58.6733 29.3241 58.5657Z" fill="#91D7EC" />
                <path id="Vector_751" d="M24.7411 53.168C24.7631 53.1862 24.7906 53.2008 24.8199 53.2081C24.8346 53.2118 24.8493 53.2081 24.8621 53.2081C24.9556 53.2099 25.0418 53.1516 25.0638 53.0586C25.0839 52.9802 25.0528 52.9017 24.9923 52.8543C24.9703 52.8361 24.9446 52.8215 24.9153 52.8142C24.8328 52.7942 24.7521 52.827 24.7044 52.8908C24.6898 52.9109 24.6769 52.9364 24.6714 52.9619C24.6531 53.0403 24.6824 53.1169 24.7411 53.1643V53.168Z" fill="#91D7EC" />
                <path id="Vector_752" d="M24.5818 54.4955C24.6918 54.481 24.7707 54.3788 24.7542 54.2676C24.7468 54.2184 24.7212 54.1782 24.6863 54.1472C24.6442 54.1089 24.5873 54.0871 24.525 54.0962C24.4664 54.1053 24.4169 54.1381 24.3857 54.1837C24.3582 54.2238 24.3454 54.2712 24.3509 54.3223C24.3582 54.3734 24.3857 54.4153 24.4205 54.4463C24.4554 54.4755 24.4993 54.4919 24.547 54.4919C24.5562 54.4919 24.5653 54.4955 24.5763 54.4919C24.5763 54.4919 24.5782 54.4919 24.58 54.4919L24.5818 54.4955Z" fill="#91D7EC" />
                <path id="Vector_753" d="M24.9135 55.5058C24.9025 55.4876 24.8878 55.473 24.8731 55.4584C24.8108 55.4 24.7155 55.3854 24.6385 55.4292C24.6018 55.4493 24.578 55.4803 24.5615 55.5149C24.5321 55.5733 24.5285 55.6426 24.5615 55.7046C24.5688 55.7173 24.5798 55.7264 24.5908 55.7374C24.644 55.7957 24.7246 55.8176 24.8016 55.7921C24.8145 55.7884 24.8273 55.7866 24.8383 55.7793C24.9355 55.7246 24.9703 55.6006 24.9153 55.504L24.9135 55.5058Z" fill="#91D7EC" />
                <path id="Vector_754" d="M25.2362 56.8753C25.2435 56.8844 25.249 56.8954 25.2581 56.9027C25.3241 56.961 25.4176 56.9665 25.491 56.9264C25.5111 56.9154 25.5295 56.9027 25.546 56.8862C25.6193 56.8024 25.612 56.6747 25.5276 56.6018C25.4433 56.5288 25.3168 56.5379 25.2435 56.62C25.2252 56.6401 25.2123 56.6638 25.205 56.6875C25.183 56.7513 25.1977 56.8224 25.2398 56.8771L25.2362 56.8753Z" fill="#91D7EC" />
                <path id="Vector_755" d="M26.5687 57.716C26.6109 57.6303 26.5834 57.53 26.5119 57.4717C26.5101 57.4698 26.5064 57.468 26.5046 57.4662C26.4954 57.4589 26.4881 57.4516 26.4789 57.4461C26.4477 57.4315 26.4166 57.4261 26.3854 57.4279C26.3121 57.4279 26.2424 57.468 26.2076 57.5373C26.2002 57.5537 26.1984 57.5701 26.1947 57.5884C26.1874 57.6212 26.1874 57.654 26.1966 57.685C26.2424 57.7105 26.2736 57.7507 26.2882 57.7981C26.2919 57.7999 26.2956 57.8054 26.2992 57.8072C26.3726 57.8437 26.4587 57.8309 26.5174 57.7817C26.5394 57.7634 26.5577 57.7434 26.5706 57.716H26.5687Z" fill="#91D7EC" />
                <path id="Vector_756" d="M27.7732 58.2649C27.7952 58.1828 27.7622 58.099 27.698 58.0515C27.6778 58.037 27.6558 58.0242 27.6302 58.0169C27.522 57.9877 27.4102 58.0515 27.3827 58.1591C27.3772 58.1828 27.3772 58.2047 27.379 58.2266C27.4487 58.2558 27.4945 58.3196 27.5019 58.3925C27.511 58.3962 27.5184 58.4035 27.5275 58.4053C27.599 58.4254 27.6723 58.3998 27.72 58.3506C27.7438 58.3269 27.7658 58.2977 27.775 58.2631L27.7732 58.2649Z" fill="#91D7EC" />
                <path id="Vector_757" d="M28.9722 58.3889C28.9465 58.3706 28.9172 58.3579 28.8842 58.3542C28.7724 58.3414 28.6715 58.4199 28.6587 58.5311C28.6587 58.5329 28.6587 58.5366 28.6587 58.5384C28.7412 58.5694 28.7962 58.6478 28.7907 58.739C28.8053 58.7444 28.82 58.7517 28.8365 58.7536C28.9062 58.7609 28.9703 58.7299 29.0125 58.6806C29.0363 58.6514 29.0565 58.6168 29.0602 58.5767C29.0693 58.5001 29.0308 58.429 28.9703 58.3889H28.9722Z" fill="#91D7EC" />
                <path id="Vector_758" d="M30.1127 58.852C30.1127 58.8648 30.1072 58.8776 30.1054 58.8885C30.1219 58.8958 30.1384 58.9031 30.1567 58.9049C30.2685 58.9177 30.3694 58.8393 30.3822 58.728C30.395 58.6168 30.3162 58.5165 30.2044 58.5037C30.0999 58.491 30.0064 58.5621 29.9844 58.6642C30.0595 58.6934 30.1145 58.7663 30.1145 58.8502L30.1127 58.852Z" fill="#91D7EC" />
                <path id="Vector_759" d="M24.0942 54.3953C24.085 54.3953 24.0777 54.4026 24.0685 54.4044C23.9732 54.4354 23.9127 54.5284 23.931 54.6287C23.9512 54.7381 24.0575 54.8111 24.1675 54.791C24.2775 54.7709 24.3508 54.6652 24.3306 54.5558C24.3288 54.543 24.3215 54.5339 24.3178 54.5229C24.283 54.4336 24.1932 54.377 24.096 54.3935L24.0942 54.3953Z" fill="#91D7EC" />
                <path id="Vector_760" d="M24.2627 55.721C24.2517 55.7283 24.2444 55.7374 24.2352 55.7465C24.1656 55.8104 24.1454 55.9143 24.1967 55.9982C24.2554 56.093 24.38 56.1222 24.4754 56.0638C24.567 56.0073 24.5964 55.8888 24.5432 55.794C24.5432 55.7921 24.5432 55.7885 24.5395 55.7848C24.4809 55.69 24.3562 55.6608 24.2609 55.7192L24.2627 55.721Z" fill="#91D7EC" />
                <path id="Vector_761" d="M25.227 56.8917C25.2179 56.8808 25.2124 56.868 25.1995 56.8589C25.1134 56.7878 24.985 56.8005 24.9136 56.8863C24.9026 56.9008 24.8971 56.9154 24.8897 56.9318C24.8531 57.0103 24.8696 57.1033 24.9356 57.1634C24.9374 57.1653 24.9392 57.1689 24.9411 57.1689C25.0015 57.22 25.084 57.2254 25.1519 57.1963C25.1794 57.1835 25.205 57.1671 25.2252 57.1434C25.249 57.116 25.26 57.0832 25.2655 57.0485C25.2747 56.9938 25.2619 56.9373 25.2252 56.8917H25.227Z" fill="#91D7EC" />
                <path id="Vector_762" d="M26.1952 57.685C26.1952 57.685 26.186 57.6759 26.1787 57.674C26.0778 57.6266 25.9568 57.6722 25.9092 57.7725C25.8982 57.7962 25.8927 57.8236 25.8908 57.8473C25.8872 57.9257 25.9312 58.0041 26.0082 58.0387C26.109 58.0862 26.23 58.0406 26.2776 57.9403C26.2996 57.8929 26.2996 57.8436 26.285 57.798C26.2703 57.7506 26.2392 57.7105 26.1933 57.685H26.1952Z" fill="#91D7EC" />
                <path id="Vector_763" d="M27.3772 58.2302C27.368 58.2266 27.3589 58.2193 27.3479 58.2175C27.2397 58.1919 27.1297 58.2576 27.1022 58.3652C27.0765 58.4728 27.1425 58.5822 27.2507 58.6095C27.3589 58.6351 27.4689 58.5694 27.4964 58.4618C27.5019 58.44 27.5 58.4199 27.4982 58.398C27.4927 58.3251 27.445 58.2612 27.3754 58.2321L27.3772 58.2302Z" fill="#91D7EC" />
                <path id="Vector_764" d="M28.659 58.5384C28.6425 58.5329 28.6279 58.5256 28.6095 58.5238C28.4977 58.5129 28.3987 58.5931 28.3877 58.7044C28.3767 58.8156 28.4574 58.9141 28.5692 58.925C28.681 58.936 28.78 58.8557 28.791 58.7445V58.7408C28.7984 58.6497 28.7415 58.5712 28.659 58.5402V58.5384Z" fill="#91D7EC" />
                <path id="Vector_765" d="M29.8175 59.029C29.845 59.0436 29.8762 59.0545 29.911 59.0545C30.01 59.0545 30.0889 58.9834 30.1054 58.8904C30.1072 58.8776 30.1127 58.8667 30.1127 58.8539C30.1127 58.7682 30.0595 58.6971 29.9825 58.6679C29.9605 58.6588 29.9349 58.6533 29.9092 58.6533C29.7974 58.6533 29.7057 58.7445 29.7075 58.8557C29.7075 58.8995 29.724 58.9378 29.7497 58.9724C29.7772 58.987 29.7992 59.0071 29.8175 59.0326V59.029Z" fill="#91D7EC" />
                <path id="Vector_766" d="M31.2383 58.6496C31.1265 58.6496 31.0348 58.7408 31.0366 58.852C31.0366 58.8685 31.0421 58.883 31.0458 58.8976C31.11 58.9195 31.1576 58.9724 31.176 59.0399C31.1961 59.0472 31.2181 59.0526 31.2401 59.0526C31.352 59.0526 31.4436 58.9615 31.4418 58.8502C31.4418 58.739 31.3501 58.6478 31.2383 58.6496Z" fill="#91D7EC" />
                <path id="Vector_767" d="M23.988 56.7549C24.0081 56.6911 23.999 56.6218 23.9531 56.5671C23.8817 56.4814 23.7533 56.4705 23.6672 56.5434C23.581 56.6145 23.57 56.7422 23.6433 56.8279C23.691 56.8844 23.7643 56.9063 23.834 56.8935C23.867 56.8881 23.9018 56.8753 23.9293 56.8534C23.9605 56.8279 23.9788 56.7932 23.9898 56.7568L23.988 56.7549Z" fill="#91D7EC" />
                <path id="Vector_768" d="M24.7614 57.5391C24.6679 57.4789 24.5414 57.5063 24.4809 57.5993C24.4204 57.6923 24.4479 57.8181 24.5414 57.8783C24.6349 57.9385 24.7614 57.9111 24.8219 57.8181C24.8824 57.7251 24.8549 57.5993 24.7614 57.5391Z" fill="#91D7EC" />
                <path id="Vector_769" d="M25.8358 58.2339C25.7294 58.1974 25.6139 58.2521 25.5773 58.3561C25.5406 58.46 25.5956 58.5767 25.7001 58.6132C25.8046 58.6497 25.9219 58.595 25.9586 58.491C25.9953 58.3871 25.9403 58.2704 25.8358 58.2339Z" fill="#91D7EC" />
                <path id="Vector_770" d="M27.053 58.6661C26.943 58.6478 26.8385 58.7208 26.8202 58.832C26.8019 58.9414 26.8752 59.0454 26.987 59.0636C27.0988 59.0818 27.2015 59.0089 27.2198 58.8977C27.2382 58.7882 27.1648 58.6843 27.053 58.6661Z" fill="#91D7EC" />
                <path id="Vector_771" d="M28.5323 59.0946C28.5378 58.9834 28.4498 58.8885 28.338 58.8849C28.2262 58.8794 28.1309 58.9669 28.1272 59.0782C28.1217 59.1894 28.2097 59.2842 28.3215 59.2879C28.4333 59.2934 28.5287 59.2058 28.5323 59.0946Z" fill="#91D7EC" />
                <path id="Vector_772" d="M29.8176 59.0289C29.7992 59.0034 29.7772 58.9833 29.7497 58.9687C29.7186 58.9523 29.6856 58.9396 29.6471 58.9414C29.5352 58.9469 29.4491 59.0399 29.4527 59.1511C29.4582 59.2623 29.5517 59.3481 29.6636 59.3444C29.7754 59.3389 29.8616 59.2459 29.8579 59.1347C29.8579 59.0946 29.8396 59.0599 29.8176 59.0289Z" fill="#91D7EC" />
                <path id="Vector_773" d="M31.0456 58.8958C31.02 58.8867 30.9906 58.883 30.9613 58.8849C30.8495 58.8958 30.7688 58.9943 30.7798 59.1055C30.7908 59.2167 30.8898 59.297 31.0016 59.286C31.1135 59.2751 31.1941 59.1766 31.1831 59.0654C31.1831 59.0563 31.1776 59.0472 31.174 59.038C31.1575 58.9706 31.1098 58.9159 31.0438 58.8958H31.0456Z" fill="#91D7EC" />
                <path id="Vector_774" d="M32.2831 58.7554C32.1713 58.7663 32.0906 58.8648 32.1016 58.976C32.1053 59.0125 32.1218 59.0435 32.1419 59.0709C32.1804 59.0855 32.2134 59.1092 32.2354 59.1438C32.2629 59.1529 32.2922 59.1584 32.3234 59.1566C32.4352 59.1456 32.5159 59.0472 32.5049 58.9359C32.4939 58.8247 32.3949 58.7445 32.2831 58.7554Z" fill="#91D7EC" />
                <path id="Vector_775" d="M24.2809 58.8429C24.1745 58.8065 24.059 58.863 24.0224 58.9688C23.9857 59.0745 24.0425 59.1894 24.1489 59.2259C24.2552 59.2624 24.3707 59.2058 24.4073 59.1001C24.444 58.9943 24.3872 58.8794 24.2809 58.8429Z" fill="#91D7EC" />
                <path id="Vector_776" d="M25.5018 59.2642C25.3918 59.2477 25.2873 59.3225 25.2708 59.4319C25.2543 59.5413 25.3295 59.6453 25.4395 59.6617C25.5495 59.6781 25.654 59.6033 25.6705 59.4939C25.687 59.3845 25.6118 59.2806 25.5018 59.2642Z" fill="#91D7EC" />
                <path id="Vector_777" d="M26.7778 59.8696C26.8896 59.8733 26.9831 59.7857 26.9868 59.6745C26.9905 59.5632 26.9025 59.4702 26.7906 59.4666C26.6788 59.463 26.5853 59.5505 26.5817 59.6617C26.578 59.773 26.666 59.866 26.7778 59.8696Z" fill="#91D7EC" />
                <path id="Vector_778" d="M27.907 59.7183C27.9143 59.8295 28.0097 59.9134 28.1215 59.9079C28.2333 59.9024 28.3176 59.8058 28.3121 59.6945C28.3048 59.5833 28.2095 59.4994 28.0976 59.5049C27.9858 59.5104 27.9015 59.607 27.907 59.7183Z" fill="#91D7EC" />
                <path id="Vector_779" d="M29.6376 59.6016C29.6248 59.4903 29.5239 59.4119 29.4121 59.4265C29.3003 59.4411 29.2215 59.5395 29.2361 59.6508C29.249 59.762 29.3498 59.8404 29.4616 59.8259C29.5734 59.8113 29.6523 59.7128 29.6376 59.6016Z" fill="#91D7EC" />
                <path id="Vector_780" d="M30.7854 59.6635C30.8954 59.6453 30.9705 59.5432 30.954 59.4319C30.9357 59.3225 30.833 59.2477 30.7212 59.2642C30.6112 59.2824 30.5361 59.3845 30.5526 59.4958C30.5691 59.607 30.6736 59.6799 30.7854 59.6635Z" fill="#91D7EC" />
                <path id="Vector_781" d="M32.1401 59.0727C32.1053 59.0581 32.0686 59.0508 32.0283 59.0581C31.9183 59.0782 31.845 59.1839 31.8652 59.2933C31.8853 59.4028 31.9916 59.4757 32.1016 59.4556C32.2116 59.4356 32.285 59.3298 32.2648 59.2204C32.2593 59.193 32.2501 59.1675 32.2355 59.1456C32.2135 59.111 32.1786 59.0891 32.142 59.0727H32.1401Z" fill="#91D7EC" />
                <path id="Vector_782" d="M33.4088 59.2149C33.5188 59.1949 33.5921 59.0891 33.5719 58.9797C33.5518 58.8703 33.4454 58.7973 33.3354 58.8174C33.2254 58.8375 33.1521 58.9432 33.1723 59.0526C33.1924 59.1621 33.2988 59.235 33.4088 59.2149Z" fill="#91D7EC" />
                <path id="Vector_783" d="M25.3573 60.8963C25.2473 60.9127 25.1703 61.0148 25.1868 61.126C25.2033 61.2354 25.306 61.312 25.4178 61.2956C25.5278 61.2792 25.6048 61.1771 25.5883 61.0658C25.5718 60.9564 25.4691 60.8798 25.3573 60.8963Z" fill="#91D7EC" />
                <path id="Vector_784" d="M26.8969 60.8635C26.8749 60.7541 26.7686 60.6829 26.6586 60.7048C26.5486 60.7267 26.4771 60.8325 26.4991 60.9419C26.5211 61.0513 26.6274 61.1224 26.7374 61.1005C26.8474 61.0787 26.9189 60.9729 26.8969 60.8635Z" fill="#91D7EC" />
                <path id="Vector_785" d="M28.0484 60.8398C28.1566 60.8142 28.2244 60.7066 28.2005 60.5972C28.1767 60.4878 28.0667 60.4222 27.9567 60.4459C27.8486 60.4714 27.7807 60.579 27.8046 60.6884C27.8284 60.7978 27.9384 60.8635 28.0484 60.8398Z" fill="#91D7EC" />
                <path id="Vector_786" d="M29.2457 60.1486C29.1375 60.176 29.0715 60.2854 29.099 60.393C29.1265 60.5006 29.2365 60.5662 29.3447 60.5388C29.4528 60.5115 29.5188 60.4021 29.4913 60.2945C29.4638 60.1869 29.3538 60.1212 29.2457 60.1486Z" fill="#91D7EC" />
                <path id="Vector_787" d="M30.3859 60.0702C30.4134 60.1778 30.5252 60.2434 30.6334 60.2143C30.7415 60.1851 30.8075 60.0757 30.7782 59.9681C30.7507 59.8605 30.6389 59.7948 30.5307 59.824C30.4225 59.8514 30.3566 59.9626 30.3859 60.0702Z" fill="#91D7EC" />
                <path id="Vector_788" d="M31.9166 59.8824C32.0247 59.855 32.0907 59.7438 32.0614 59.6362C32.0339 59.5286 31.9221 59.4629 31.8139 59.4921C31.7057 59.5195 31.6398 59.6307 31.6691 59.7383C31.6966 59.8459 31.8084 59.9115 31.9166 59.8824Z" fill="#91D7EC" />
                <path id="Vector_789" d="M32.9559 59.4064C32.9834 59.514 33.0934 59.5797 33.2016 59.5523C33.3098 59.525 33.3758 59.4156 33.3483 59.308C33.3208 59.2004 33.2108 59.1347 33.1026 59.1621C32.9944 59.1894 32.9284 59.2989 32.9559 59.4064Z" fill="#91D7EC" />
                <path id="Vector_790" d="M34.4902 59.2313C34.5983 59.204 34.6643 59.0946 34.6368 58.987C34.6093 58.8794 34.4993 58.8138 34.3912 58.8411C34.283 58.8685 34.217 58.9779 34.2445 59.0855C34.272 59.1931 34.382 59.2587 34.4902 59.2313Z" fill="#91D7EC" />
                <path id="Vector_791" d="M26.857 62.3898C26.7598 62.4445 26.725 62.5685 26.78 62.6652C26.835 62.7618 26.9597 62.7965 27.0568 62.7417C27.154 62.687 27.1888 62.563 27.1338 62.4664C27.0788 62.3697 26.9542 62.3351 26.857 62.3898Z" fill="#91D7EC" />
                <path id="Vector_792" d="M28.0207 61.7333C27.9217 61.7844 27.8813 61.9047 27.9308 62.005C27.9822 62.1035 28.1032 62.1436 28.204 62.0944C28.303 62.0433 28.3433 61.9229 28.2938 61.8226C28.2443 61.7223 28.1215 61.6841 28.0207 61.7333Z" fill="#91D7EC" />
                <path id="Vector_793" d="M29.482 61.2337C29.4362 61.1315 29.3152 61.0878 29.2143 61.1334C29.1135 61.1789 29.0677 61.2993 29.1135 61.3996C29.1593 61.5017 29.2803 61.5455 29.3812 61.4999C29.4838 61.4543 29.5278 61.3339 29.482 61.2337Z" fill="#91D7EC" />
                <path id="Vector_794" d="M30.5821 60.9583C30.6847 60.9164 30.736 60.7978 30.692 60.6957C30.648 60.5936 30.5307 60.5425 30.4281 60.5863C30.3254 60.6282 30.2741 60.7468 30.3181 60.8489C30.3621 60.951 30.4794 61.0021 30.5821 60.9583Z" fill="#91D7EC" />
                <path id="Vector_795" d="M31.5423 60.3383C31.5808 60.4423 31.6981 60.4951 31.8026 60.4568C31.9071 60.4185 31.9603 60.3018 31.9218 60.1979C31.8833 60.0939 31.766 60.0411 31.6615 60.0794C31.557 60.1177 31.5038 60.2344 31.5423 60.3383Z" fill="#91D7EC" />
                <path id="Vector_796" d="M32.914 59.6198C32.8076 59.6544 32.7508 59.7693 32.7856 59.8751C32.8205 59.9809 32.936 60.0374 33.0423 60.0028C33.1486 59.9681 33.2054 59.8532 33.1706 59.7475C33.1358 59.6417 33.0203 59.5852 32.914 59.6198Z" fill="#91D7EC" />
                <path id="Vector_797" d="M34.045 59.4502C34.078 59.556 34.1898 59.618 34.298 59.5852C34.4043 59.5523 34.4666 59.4411 34.4336 59.3335C34.4006 59.2277 34.2888 59.1657 34.1806 59.1986C34.0743 59.2314 34.012 59.3426 34.045 59.4502Z" fill="#91D7EC" />
                <path id="Vector_798" d="M35.5685 59.204C35.6748 59.1712 35.7371 59.0599 35.7041 58.9523C35.6711 58.8466 35.5593 58.7846 35.4512 58.8174C35.3448 58.8502 35.2825 58.9615 35.3155 59.0691C35.3302 59.1165 35.3632 59.1548 35.4017 59.1785C35.409 59.1821 35.4145 59.1858 35.42 59.1894C35.464 59.2113 35.5153 59.2186 35.5666 59.2022L35.5685 59.204Z" fill="#91D7EC" />
                <path id="Vector_799" d="M28.4262 63.2833C28.3455 63.3599 28.3437 63.4876 28.4207 63.5678C28.4977 63.6481 28.626 63.6499 28.7066 63.5733C28.7873 63.4967 28.7891 63.369 28.7121 63.2888C28.6351 63.2086 28.5068 63.2068 28.4262 63.2833Z" fill="#91D7EC" />
                <path id="Vector_800" d="M29.3958 62.3497C29.3078 62.4172 29.2913 62.5448 29.3592 62.6323C29.427 62.7199 29.5553 62.7363 29.6433 62.6688C29.7313 62.6013 29.7478 62.4737 29.68 62.3861C29.6122 62.2986 29.4838 62.2822 29.3958 62.3497Z" fill="#91D7EC" />
                <path id="Vector_801" d="M30.743 61.5965C30.6825 61.5017 30.5579 61.4743 30.4626 61.5345C30.3672 61.5947 30.3397 61.7187 30.4002 61.8135C30.4607 61.9084 30.5854 61.9357 30.6807 61.8755C30.776 61.8153 30.8035 61.6913 30.743 61.5965Z" fill="#91D7EC" />
                <path id="Vector_802" d="M31.7898 61.1753C31.8888 61.1224 31.9273 61.0021 31.8741 60.9036C31.8209 60.8051 31.6999 60.7668 31.601 60.8197C31.502 60.8726 31.4635 60.993 31.5166 61.0914C31.5698 61.1899 31.6908 61.2282 31.7898 61.1753Z" fill="#91D7EC" />
                <path id="Vector_803" d="M32.9522 60.5644C33.0549 60.5188 33.0989 60.3985 33.0531 60.2982C33.0072 60.196 32.8863 60.1523 32.7854 60.1979C32.6828 60.2435 32.6388 60.3638 32.6846 60.4641C32.7304 60.5662 32.8514 60.61 32.9522 60.5644Z" fill="#91D7EC" />
                <path id="Vector_804" d="M34.2685 59.7639C34.2281 59.6599 34.1108 59.6089 34.0063 59.649C33.922 59.6818 33.8743 59.7639 33.8798 59.8496C33.9678 59.8386 34.054 59.8842 34.0906 59.9681C34.0998 59.99 34.1035 60.0119 34.1035 60.0338C34.12 60.0319 34.1365 60.0319 34.153 60.0246C34.2575 59.9845 34.3088 59.8678 34.2685 59.7639Z" fill="#91D7EC" />
                <path id="Vector_805" d="M35.3172 59.4629C35.3282 59.4957 35.3301 59.5286 35.3246 59.5596C35.3429 59.5596 35.3631 59.5596 35.3814 59.5523C35.4877 59.5176 35.5446 59.4028 35.5097 59.297C35.4932 59.2496 35.4602 59.2149 35.4217 59.1912C35.4162 59.1876 35.4089 59.1821 35.4034 59.1803C35.3576 59.1602 35.3062 59.1547 35.2549 59.1712C35.1798 59.1967 35.1303 59.2605 35.1211 59.3335C35.2073 59.3298 35.2879 59.379 35.3191 59.4629H35.3172Z" fill="#91D7EC" />
                <path id="Vector_806" d="M36.5674 59.0235C36.5802 59.0654 36.5747 59.1074 36.5619 59.1457C36.5875 59.1457 36.6132 59.1457 36.6407 59.1365C36.747 59.1019 36.8038 58.987 36.769 58.8812C36.7342 58.7755 36.6187 58.7189 36.5124 58.7536C36.45 58.7737 36.4079 58.8247 36.3877 58.8812C36.4684 58.8867 36.5417 58.9396 36.5674 59.0217V59.0235Z" fill="#91D7EC" />
                <path id="Vector_807" d="M29.8468 63.6754C29.779 63.7629 29.7955 63.8906 29.8853 63.958C29.9733 64.0255 30.1017 64.0091 30.1695 63.9197C30.2373 63.8322 30.2208 63.7046 30.131 63.6371C30.0412 63.5696 29.9147 63.586 29.8468 63.6754Z" fill="#91D7EC" />
                <path id="Vector_808" d="M30.9597 62.6068C30.8827 62.5266 30.7544 62.5247 30.6737 62.6013C30.5931 62.6779 30.5912 62.8056 30.6682 62.8858C30.7452 62.966 30.8735 62.9679 30.9542 62.8913C31.0349 62.8147 31.0367 62.687 30.9597 62.6068Z" fill="#91D7EC" />
                <path id="Vector_809" d="M31.9309 61.7096C31.8631 61.6203 31.7366 61.602 31.6468 61.6695C31.5569 61.737 31.5386 61.8628 31.6064 61.9522C31.6742 62.0415 31.8007 62.0597 31.8906 61.9923C31.9804 61.9248 31.9987 61.799 31.9309 61.7096Z" fill="#91D7EC" />
                <path id="Vector_810" d="M32.6588 61.1425C32.7174 61.2373 32.8421 61.2683 32.9374 61.2118C33.0327 61.1552 33.0639 61.0294 33.0071 60.9346C32.9484 60.8397 32.8237 60.8087 32.7284 60.8653C32.6331 60.9218 32.6019 61.0476 32.6588 61.1425Z" fill="#91D7EC" />
                <path id="Vector_811" d="M33.9824 60.2325C33.9255 60.2562 33.8669 60.2507 33.8156 60.227C33.7642 60.2872 33.7514 60.3729 33.7881 60.4477C33.8376 60.548 33.9585 60.5881 34.0594 60.5389C34.1602 60.4896 34.2005 60.3693 34.151 60.269C34.1309 60.227 34.0942 60.1979 34.0539 60.1796C34.0337 60.2015 34.0117 60.2216 33.9805 60.2343L33.9824 60.2325Z" fill="#91D7EC" />
                <path id="Vector_812" d="M35.3466 59.6927C35.3356 59.6672 35.3209 59.6453 35.3026 59.6271C35.2806 59.669 35.2439 59.7037 35.1944 59.7219C35.1193 59.7493 35.0386 59.7274 34.9836 59.6745C34.9543 59.7255 34.9469 59.7875 34.9708 59.8477C35.0129 59.9498 35.1321 59.9991 35.2348 59.9571C35.3374 59.9152 35.3869 59.7967 35.3448 59.6945L35.3466 59.6927Z" fill="#91D7EC" />
                <path id="Vector_813" d="M36.5785 59.1985C36.573 59.1858 36.5657 59.1748 36.5583 59.1639C36.5345 59.2149 36.4924 59.2569 36.4355 59.2733C36.3439 59.3006 36.2504 59.2587 36.2045 59.1803C36.1844 59.2259 36.1789 59.2788 36.1972 59.3298C36.21 59.3663 36.2339 59.3937 36.2614 59.4155C36.2944 59.4228 36.3237 59.4356 36.3494 59.4575C36.3842 59.4648 36.419 59.4666 36.4557 59.4538C36.562 59.4174 36.617 59.3025 36.5803 59.1967L36.5785 59.1985Z" fill="#91D7EC" />
                <path id="Vector_814" d="M37.8323 58.7682C37.8323 58.7682 37.8323 58.7664 37.8304 58.7646C37.8084 58.8229 37.7608 58.8722 37.6966 58.8886C37.594 58.9159 37.4913 58.8576 37.4565 58.7591C37.4381 58.8029 37.4345 58.8521 37.451 58.8995C37.451 58.9013 37.4528 58.9032 37.4546 58.905C37.5316 58.9086 37.6013 58.9579 37.6306 59.0345C37.6563 59.0345 37.682 59.0345 37.7076 59.0235C37.7406 59.0126 37.7663 58.9907 37.7883 58.967C37.7956 58.9305 37.8121 58.8995 37.8359 58.8722C37.8433 58.8375 37.8451 58.8029 37.8323 58.7682Z" fill="#91D7EC" />
                <path id="Vector_815" d="M31.0346 63.6627C30.9723 63.7557 30.9961 63.8797 31.0896 63.9435C31.1831 64.0055 31.3078 63.9818 31.372 63.8888C31.4343 63.7958 31.4105 63.6718 31.317 63.6079C31.2235 63.5459 31.0988 63.5696 31.0346 63.6627Z" fill="#91D7EC" />
                <path id="Vector_816" d="M32.0927 62.8202C32.1697 62.7399 32.1678 62.6123 32.0853 62.5357C32.0047 62.4591 31.8764 62.4609 31.7994 62.543C31.7224 62.6232 31.7242 62.7509 31.8067 62.8275C31.8874 62.9041 32.0157 62.9022 32.0927 62.8202Z" fill="#91D7EC" />
                <path id="Vector_817" d="M32.7376 61.5692C32.6496 61.6385 32.635 61.7661 32.7046 61.8518C32.7743 61.9375 32.9026 61.954 32.9888 61.8847C33.0768 61.8154 33.0914 61.6877 33.0218 61.602C32.9521 61.5145 32.8238 61.4999 32.7376 61.5692Z" fill="#91D7EC" />
                <path id="Vector_818" d="M33.7956 60.734C33.7002 60.7923 33.6727 60.9182 33.7314 61.0112C33.7901 61.106 33.9166 61.1334 34.0101 61.075C34.1036 61.0166 34.1329 60.8908 34.0742 60.7978C34.0156 60.703 33.8891 60.6756 33.7956 60.734Z" fill="#91D7EC" />
                <path id="Vector_819" d="M34.9375 60.0246C34.8367 60.0757 34.7982 60.196 34.8477 60.2963C34.899 60.3966 35.02 60.4349 35.1208 60.3857C35.2216 60.3346 35.2601 60.2143 35.2106 60.114C35.1593 60.0137 35.0383 59.9754 34.9375 60.0246Z" fill="#91D7EC" />
                <path id="Vector_820" d="M36.1382 59.4247C36.0356 59.4666 35.9861 59.5851 36.0282 59.6873C36.0356 59.7037 36.0466 59.7164 36.0576 59.731C36.1162 59.7347 36.1712 59.762 36.2079 59.8113C36.2372 59.8113 36.2647 59.8094 36.2941 59.7967C36.3967 59.7547 36.4462 59.6362 36.404 59.5341C36.3912 59.5031 36.3711 59.4794 36.3472 59.4593C36.3216 59.4374 36.2922 59.4247 36.2592 59.4174C36.2207 59.4083 36.1786 59.4083 36.1382 59.4247Z" fill="#91D7EC" />
                <path id="Vector_821" d="M37.4526 58.9068C37.4269 58.9068 37.4013 58.9068 37.3756 58.9159C37.2748 58.9506 37.2198 59.0563 37.2473 59.1584C37.328 59.1584 37.4031 59.2077 37.4343 59.2861C37.4361 59.2934 37.4343 59.2989 37.4379 59.3062C37.4599 59.3062 37.4838 59.3062 37.5058 59.297C37.6121 59.2606 37.6689 59.1475 37.6323 59.0417C37.6323 59.0399 37.6286 59.0381 37.6286 59.0344C37.5993 58.9579 37.5296 58.9104 37.4526 58.905V58.9068Z" fill="#91D7EC" />
                <path id="Vector_822" d="M38.6352 58.491C38.5508 58.5202 38.4995 58.5986 38.4995 58.6825C38.5802 58.6879 38.6517 58.7408 38.6773 58.8229C38.6828 58.8429 38.6828 58.863 38.6828 58.8831C38.7103 58.8849 38.7378 58.8831 38.7635 58.8739C38.8698 58.8375 38.9267 58.7244 38.89 58.6186C38.8772 58.584 38.8552 58.5566 38.8295 58.5348C38.8167 58.5275 38.8075 58.5184 38.7965 58.5092C38.7488 58.4819 38.6902 58.4746 38.6333 58.4928L38.6352 58.491Z" fill="#91D7EC" />
                <path id="Vector_823" d="M31.9753 63.2961C31.9112 63.3873 31.9313 63.5131 32.023 63.577C32.1147 63.6408 32.2412 63.6207 32.3053 63.5295C32.3695 63.4384 32.3493 63.3125 32.2577 63.2487C32.166 63.1849 32.0395 63.2049 31.9753 63.2961Z" fill="#91D7EC" />
                <path id="Vector_824" d="M32.7671 62.1928C32.6883 62.2713 32.6883 62.3989 32.7671 62.4773C32.7818 62.4919 32.7983 62.4992 32.8148 62.5083C32.8588 62.501 32.9028 62.5083 32.9431 62.5302C32.9834 62.5229 33.0238 62.5083 33.0549 62.4773C33.1338 62.3989 33.1338 62.2713 33.0549 62.1928C32.9761 62.1144 32.8478 62.1144 32.769 62.1928H32.7671Z" fill="#91D7EC" />
                <path id="Vector_825" d="M33.7261 61.2409C33.6381 61.3066 33.6216 61.4287 33.6839 61.5181C33.7536 61.5035 33.8287 61.5254 33.8782 61.5819C33.8819 61.5874 33.8837 61.5929 33.8874 61.5983C33.9167 61.5929 33.9461 61.5819 33.9717 61.5637C34.0616 61.4962 34.0781 61.3704 34.0102 61.281C33.9424 61.1917 33.8159 61.1753 33.7261 61.2427V61.2409Z" fill="#91D7EC" />
                <path id="Vector_826" d="M34.8039 60.4313C34.7214 60.4805 34.6903 60.5753 34.7178 60.6629C34.7911 60.6556 34.8663 60.6848 34.9103 60.7504C34.9213 60.7668 34.9268 60.7851 34.9323 60.8051C34.9598 60.8015 34.9873 60.7942 35.0129 60.7796C35.1082 60.723 35.1412 60.599 35.0826 60.5024C35.0258 60.4076 34.9011 60.3747 34.8039 60.4331V60.4313Z" fill="#91D7EC" />
                <path id="Vector_827" d="M36.0561 59.731C36.0231 59.731 35.9901 59.7328 35.959 59.7474C35.8838 59.7839 35.8398 59.8587 35.8435 59.9371C35.9186 59.9371 35.992 59.9736 36.0286 60.0447C36.0433 60.072 36.0488 60.1012 36.0506 60.1304C36.0781 60.1304 36.1075 60.1249 36.135 60.1121C36.2358 60.0647 36.2779 59.9444 36.2303 59.8441C36.2248 59.8313 36.2138 59.8222 36.2065 59.8131C36.1698 59.7638 36.1166 59.7365 36.0561 59.7328V59.731Z" fill="#91D7EC" />
                <path id="Vector_828" d="M37.2477 59.1584C37.222 59.1584 37.1963 59.1621 37.1725 59.1712C37.101 59.1986 37.0589 59.2606 37.0479 59.3317C37.1193 59.339 37.1872 59.3809 37.2165 59.452C37.2312 59.4867 37.2312 59.5232 37.2257 59.5578C37.2568 59.5615 37.2862 59.5578 37.3173 59.5469C37.4145 59.5086 37.464 59.4046 37.4365 59.3062C37.4365 59.2989 37.4365 59.2934 37.4328 59.2861C37.4017 59.2077 37.3265 59.1584 37.2458 59.1584H37.2477Z" fill="#91D7EC" />
                <path id="Vector_829" d="M38.4996 58.6843C38.474 58.6825 38.4483 58.6843 38.4226 58.6916C38.3566 58.7117 38.3126 58.7646 38.2925 58.8266C38.3603 58.8411 38.4226 58.8867 38.4465 58.956C38.4611 58.998 38.4575 59.0399 38.4465 59.0782C38.4795 59.0855 38.5125 59.0855 38.5455 59.0764C38.6316 59.049 38.6848 58.9688 38.6848 58.8831C38.6848 58.863 38.6848 58.843 38.6793 58.8229C38.6536 58.7427 38.5821 58.6898 38.5015 58.6825L38.4996 58.6843Z" fill="#91D7EC" />
                <path id="Vector_830" d="M39.7094 58.5457C39.7222 58.5913 39.7149 58.6369 39.6966 58.6788C39.7332 58.6898 39.7717 58.6934 39.8121 58.6806C39.9184 58.6478 39.9789 58.5348 39.9441 58.4272C39.9092 58.3196 39.7974 58.2612 39.6892 58.2959C39.6306 58.3141 39.5884 58.3561 39.5664 58.4071C39.6324 58.4253 39.6892 58.4746 39.7076 58.5457H39.7094Z" fill="#91D7EC" />
                <path id="Vector_831" d="M32.8145 62.5101C32.7705 62.5174 32.7284 62.5375 32.6954 62.5721C32.622 62.656 32.6294 62.7836 32.7137 62.8566C32.798 62.9295 32.9264 62.9222 32.9997 62.8384C33.073 62.7545 33.0657 62.6268 32.9813 62.5539C32.9685 62.5429 32.9557 62.5375 32.941 62.5302C32.9007 62.5083 32.8567 62.501 32.8127 62.5083L32.8145 62.5101Z" fill="#91D7EC" />
                <path id="Vector_832" d="M33.6837 61.5181C33.6507 61.5254 33.6195 61.5364 33.592 61.5582C33.592 61.5582 33.592 61.5582 33.5902 61.5601C33.6067 61.6294 33.5847 61.7041 33.5278 61.7552C33.5352 61.7862 33.5462 61.8154 33.5682 61.8409C33.6397 61.9266 33.768 61.9375 33.8541 61.8646C33.9348 61.7971 33.9458 61.6804 33.8871 61.5965C33.8835 61.5911 33.8816 61.5856 33.878 61.5801C33.8285 61.5218 33.7533 61.5017 33.6837 61.5163V61.5181Z" fill="#91D7EC" />
                <path id="Vector_833" d="M34.7176 60.6629C34.6864 60.6665 34.6571 60.6738 34.6296 60.6921C34.6241 60.6957 34.6223 60.6993 34.6168 60.703C34.6553 60.7869 34.6314 60.8853 34.5581 60.9419C34.5618 60.951 34.5636 60.9619 34.5691 60.9692C34.6296 61.0622 34.7561 61.0878 34.8496 61.0276C34.9266 60.9783 34.9541 60.8853 34.9303 60.8033C34.9248 60.785 34.9193 60.7668 34.9083 60.7486C34.8643 60.6829 34.7891 60.6519 34.7158 60.661L34.7176 60.6629Z" fill="#91D7EC" />
                <path id="Vector_834" d="M36.0302 60.0447C35.9935 59.9735 35.9202 59.9353 35.845 59.9371C35.8157 59.9371 35.7845 59.9425 35.757 59.9571C35.746 59.9626 35.7405 59.9717 35.7314 59.979C35.7369 59.9863 35.7424 59.9918 35.7479 59.9991C35.7919 60.0866 35.7625 60.1887 35.6855 60.2471C35.7424 60.331 35.8524 60.3638 35.944 60.3164C36.0155 60.2799 36.054 60.2051 36.0522 60.1304C36.0522 60.1012 36.0449 60.072 36.0302 60.0447Z" fill="#91D7EC" />
                <path id="Vector_835" d="M37.2165 59.452C37.1871 59.3809 37.1193 59.339 37.0478 59.3317C37.0166 59.328 36.9836 59.3317 36.9507 59.3444C36.9323 59.3517 36.9195 59.3645 36.9048 59.3754C36.9177 59.3918 36.9305 59.4064 36.9397 59.4265C36.9745 59.5104 36.9433 59.6034 36.8755 59.6581C36.9305 59.7237 37.0221 59.7511 37.1065 59.7164C37.1743 59.6891 37.2146 59.6271 37.2256 59.5596C37.2311 59.525 37.2311 59.4885 37.2165 59.4538V59.452Z" fill="#91D7EC" />
                <path id="Vector_836" d="M38.4463 58.956C38.4225 58.8849 38.362 58.8393 38.2923 58.8266C38.2593 58.8193 38.2245 58.8193 38.1878 58.8302C38.164 58.8375 38.1438 58.8521 38.1255 58.8667C38.1475 58.8886 38.164 58.9123 38.175 58.9433C38.2025 59.0253 38.1732 59.111 38.1108 59.1621C38.164 59.215 38.2428 59.2387 38.318 59.2132C38.3822 59.1913 38.4243 59.1402 38.4427 59.08C38.4555 59.0417 38.4592 58.9998 38.4427 58.9579L38.4463 58.956Z" fill="#91D7EC" />
                <path id="Vector_837" d="M39.4421 58.5402C39.4623 58.6168 39.4348 58.6952 39.3779 58.7445C39.4274 58.7901 39.4971 58.8138 39.5668 58.7937C39.6291 58.7773 39.6731 58.7335 39.6969 58.6788C39.7152 58.6387 39.7226 58.5931 39.7097 58.5457C39.6896 58.4746 39.6346 58.4272 39.5686 58.4071C39.5338 58.398 39.4989 58.3944 39.4623 58.4035C39.4311 58.4126 39.4054 58.4272 39.3834 58.4472C39.4109 58.4728 39.4329 58.5019 39.4439 58.5402H39.4421Z" fill="#91D7EC" />
                <path id="Vector_838" d="M40.7271 58.2084C40.7436 58.2813 40.7143 58.3524 40.6611 58.3998C40.7106 58.4436 40.7785 58.4655 40.8481 58.4472C40.9563 58.4181 41.0204 58.3068 40.9911 58.1992C40.9618 58.0916 40.85 58.0278 40.7418 58.057C40.7106 58.0661 40.685 58.0825 40.6611 58.1026C40.6923 58.1299 40.718 58.1646 40.7271 58.2084Z" fill="#91D7EC" />
                <path id="Vector_839" d="M33.5902 61.5601C33.5828 61.5327 33.5718 61.5054 33.5535 61.4817C33.4838 61.3941 33.3573 61.3795 33.2693 61.4488C33.1814 61.5181 33.1667 61.6439 33.2364 61.7315C33.306 61.819 33.4325 61.8336 33.5205 61.7643C33.5242 61.7625 33.5242 61.7588 33.5278 61.7552C33.5847 61.7041 33.6067 61.6294 33.5902 61.5601Z" fill="#91D7EC" />
                <path id="Vector_840" d="M34.6169 60.703C34.6169 60.703 34.6133 60.6866 34.6078 60.6793C34.5491 60.5845 34.4244 60.5553 34.3291 60.6137C34.2338 60.672 34.2044 60.796 34.2631 60.8908C34.3218 60.9857 34.4464 61.0148 34.5418 60.9565C34.5491 60.9528 34.5528 60.9455 34.5583 60.9419C34.6316 60.8854 34.6554 60.7869 34.6169 60.703Z" fill="#91D7EC" />
                <path id="Vector_841" d="M35.7463 59.9991C35.7463 59.9991 35.7353 59.9863 35.7298 59.979C35.6748 59.8969 35.5666 59.8623 35.4731 59.9079C35.3723 59.9571 35.332 60.0793 35.3815 60.1778C35.431 60.2763 35.5538 60.3182 35.6528 60.269C35.6638 60.2635 35.6729 60.2544 35.6821 60.2471C35.7591 60.1905 35.7884 60.0884 35.7444 59.9991H35.7463Z" fill="#91D7EC" />
                <path id="Vector_842" d="M36.9411 59.4265C36.9338 59.4064 36.9191 59.39 36.9063 59.3754C36.8513 59.3098 36.7596 59.2824 36.6771 59.3152C36.5727 59.3572 36.5232 59.4739 36.5653 59.5778C36.6075 59.6818 36.7248 59.731 36.8293 59.6891C36.8476 59.6818 36.8623 59.669 36.877 59.6581C36.9448 59.6034 36.976 59.5122 36.9411 59.4265Z" fill="#91D7EC" />
                <path id="Vector_843" d="M38.177 58.9433C38.166 58.9123 38.1495 58.8885 38.1275 58.8667C38.0743 58.8138 37.9973 58.7901 37.9203 58.8156C37.8855 58.8265 37.858 58.8484 37.836 58.874C37.8121 58.9013 37.7956 58.9341 37.7883 58.9688C37.781 59.0016 37.781 59.0363 37.792 59.0691C37.8268 59.1749 37.9423 59.2314 38.0486 59.1967C38.0725 59.1894 38.0945 59.1749 38.1128 59.1603C38.1751 59.1092 38.2045 59.0235 38.177 58.9414V58.9433Z" fill="#91D7EC" />
                <path id="Vector_844" d="M39.0497 58.6442C39.079 58.7518 39.189 58.8156 39.2971 58.7864C39.3283 58.7791 39.354 58.7627 39.376 58.7426C39.4328 58.6934 39.4603 58.6168 39.4401 58.5384C39.4291 58.5001 39.4071 58.4709 39.3796 58.4454C39.3301 58.3998 39.2605 58.3761 39.1908 58.3962C39.156 58.4053 39.1285 58.4253 39.1046 58.449C39.0936 58.4691 39.0808 58.4855 39.0643 58.5019C39.0423 58.5439 39.035 58.5949 39.0478 58.6442H39.0497Z" fill="#91D7EC" />
                <path id="Vector_845" d="M40.3309 58.2466C40.3309 58.2612 40.3291 58.2758 40.3309 58.2904C40.3547 58.3998 40.4629 58.4691 40.571 58.4454C40.6059 58.4381 40.6352 58.4199 40.6609 58.3962C40.714 58.3488 40.7434 58.2795 40.7269 58.2047C40.7177 58.1609 40.692 58.1263 40.6609 58.0989C40.615 58.057 40.5509 58.0351 40.4867 58.0497C40.4629 58.0552 40.4427 58.0643 40.4244 58.077C40.4244 58.1463 40.3896 58.2102 40.3309 58.2448V58.2466Z" fill="#91D7EC" />
                <path id="Vector_846" d="M41.7848 57.7761C41.7647 57.7798 41.7464 57.7907 41.7299 57.7998C41.7299 57.8053 41.7335 57.809 41.7354 57.8144C41.7482 57.9001 41.7042 57.9786 41.6309 58.0187C41.6565 58.1263 41.7629 58.1937 41.871 58.17C41.981 58.1463 42.0507 58.0387 42.0268 57.9311C42.003 57.8217 41.8948 57.7524 41.7867 57.7761H41.7848Z" fill="#91D7EC" />
                <path id="Vector_847" d="M33.8797 59.8496C33.8613 59.8514 33.843 59.8532 33.8247 59.8605C33.722 59.9043 33.6743 60.0228 33.7165 60.1249C33.7367 60.1723 33.7733 60.2052 33.8155 60.2252C33.8668 60.2489 33.9255 60.2544 33.9823 60.2307C34.0116 60.2179 34.0355 60.1979 34.0556 60.176C34.0905 60.1359 34.107 60.0848 34.1033 60.0319C34.1033 60.01 34.0996 59.9882 34.0905 59.9663C34.0538 59.8824 33.9677 59.8386 33.8797 59.8477V59.8496Z" fill="#91D7EC" />
                <path id="Vector_848" d="M35.1942 59.7201C35.2419 59.7019 35.2786 59.6672 35.3024 59.6253C35.3134 59.6052 35.3207 59.5815 35.3244 59.5578C35.3299 59.5268 35.3281 59.494 35.3171 59.4611C35.2859 59.3773 35.2052 59.328 35.1191 59.3317C35.0989 59.3317 35.0788 59.3317 35.0586 59.3408C34.9541 59.3791 34.8991 59.494 34.9376 59.5997C34.9486 59.6289 34.9651 59.6526 34.9871 59.6727C35.0403 59.7256 35.1209 59.7474 35.1979 59.7201H35.1942Z" fill="#91D7EC" />
                <path id="Vector_849" d="M36.4334 59.2751C36.4902 59.2569 36.5324 59.215 36.5562 59.1657C36.5599 59.1602 36.5599 59.153 36.5617 59.1475C36.5745 59.1092 36.58 59.0672 36.5672 59.0253C36.5415 58.9432 36.4682 58.8904 36.3876 58.8849C36.3637 58.8849 36.3381 58.8849 36.3142 58.8922C36.2079 58.925 36.1474 59.0381 36.1804 59.1438C36.1859 59.1584 36.1951 59.1712 36.2024 59.184C36.2482 59.2624 36.3417 59.3061 36.4334 59.277V59.2751Z" fill="#91D7EC" />
                <path id="Vector_850" d="M37.6948 58.8885C37.7608 58.8721 37.8066 58.8229 37.8286 58.7645C37.8433 58.7262 37.8506 58.6861 37.8396 58.6423C37.8121 58.5347 37.7003 58.4709 37.5921 58.4983C37.4839 58.5256 37.4198 58.6369 37.4473 58.7445C37.4473 58.7499 37.4528 58.7536 37.4546 58.759C37.4894 58.8575 37.5921 58.9159 37.6948 58.8885Z" fill="#91D7EC" />
                <path id="Vector_851" d="M38.8844 58.1628C38.8385 58.1719 38.8019 58.1992 38.7744 58.2339C38.7359 58.2795 38.7157 58.3415 38.7304 58.4035C38.7396 58.4472 38.7652 58.4819 38.7964 58.5092C38.8074 58.5184 38.8165 58.5275 38.8294 58.5348C38.8715 58.5585 38.921 58.5676 38.9705 58.5567C39.009 58.5475 39.0384 58.5275 39.064 58.5038C39.0805 58.4874 39.0934 58.4709 39.1044 58.4509C39.1245 58.4108 39.1355 58.3652 39.1245 58.3178C39.1117 58.2594 39.0732 58.2138 39.0255 58.1865C38.9834 58.1628 38.9339 58.1518 38.8825 58.1628H38.8844Z" fill="#91D7EC" />
                <path id="Vector_852" d="M40.0524 57.975C40.0286 58.0151 40.0158 58.0625 40.0249 58.1135C40.0451 58.223 40.1496 58.2959 40.2596 58.2758C40.2853 58.2704 40.3073 58.2613 40.3293 58.2485C40.3879 58.2138 40.4209 58.15 40.4228 58.0807C40.4228 58.068 40.4264 58.0552 40.4228 58.0406C40.4118 57.9822 40.3769 57.9367 40.3311 57.9075C40.2889 57.8819 40.2394 57.8692 40.1881 57.8783C40.1276 57.8892 40.0818 57.9257 40.0524 57.975Z" fill="#91D7EC" />
                <path id="Vector_853" d="M41.7333 57.8126C41.7333 57.8126 41.7297 57.8035 41.7278 57.798C41.7058 57.6959 41.6087 57.6266 41.5042 57.6412C41.3942 57.6576 41.3172 57.7598 41.3319 57.8692C41.3484 57.9786 41.451 58.0552 41.561 58.0406C41.5867 58.0369 41.6087 58.0278 41.6289 58.0169C41.7003 57.9768 41.7443 57.8983 41.7333 57.8126Z" fill="#91D7EC" />
                <path id="Vector_854" d="M42.8167 57.4534C42.7067 57.4698 42.6297 57.5719 42.6444 57.6813C42.6609 57.7907 42.7635 57.8673 42.8735 57.8527C42.9835 57.8382 43.0605 57.7342 43.0458 57.6248C43.0312 57.5154 42.9267 57.4388 42.8167 57.4534Z" fill="#91D7EC" />
                <path id="Vector_855" d="M34.5765 57.798C34.4647 57.8035 34.3785 57.8965 34.384 58.0077C34.3895 58.119 34.483 58.2047 34.5949 58.1992C34.7067 58.1937 34.7928 58.1007 34.7873 57.9895C34.7818 57.8783 34.6884 57.7926 34.5765 57.798Z" fill="#91D7EC" />
                <path id="Vector_856" d="M35.8984 57.736C35.7866 57.7452 35.7041 57.8418 35.7114 57.9531C35.7206 58.0643 35.8177 58.1464 35.9295 58.1391C36.0414 58.1318 36.1239 58.0333 36.1165 57.9221C36.1074 57.8108 36.0102 57.7288 35.8984 57.736Z" fill="#91D7EC" />
                <path id="Vector_857" d="M37.2382 58.0406C37.3505 58.0406 37.4416 57.95 37.4416 57.8382C37.4416 57.7264 37.3505 57.6357 37.2382 57.6357C37.1258 57.6357 37.0347 57.7264 37.0347 57.8382C37.0347 57.95 37.1258 58.0406 37.2382 58.0406Z" fill="#91D7EC" />
                <path id="Vector_858" d="M38.54 57.5172C38.4282 57.5281 38.3475 57.6266 38.3567 57.7378C38.3677 57.8491 38.4667 57.9293 38.5785 57.9202C38.6903 57.9093 38.771 57.8108 38.7618 57.6995C38.7508 57.5883 38.6518 57.5081 38.54 57.5172Z" fill="#91D7EC" />
                <path id="Vector_859" d="M39.8635 57.3914C39.7517 57.4005 39.6692 57.499 39.6802 57.6102C39.6893 57.7214 39.7883 57.8035 39.9002 57.7925C40.012 57.7834 40.0945 57.685 40.0835 57.5737C40.0725 57.4625 39.9753 57.3804 39.8635 57.3914Z" fill="#91D7EC" />
                <path id="Vector_860" d="M41.1889 57.2747C41.0771 57.2838 40.9946 57.3804 41.0019 57.4917C41.0111 57.6029 41.1082 57.685 41.2201 57.6777C41.3319 57.6686 41.4144 57.5719 41.4071 57.4607C41.3979 57.3495 41.3007 57.2674 41.1889 57.2747Z" fill="#91D7EC" />
                <path id="Vector_861" d="M42.5144 57.1725C42.4172 57.178 42.3457 57.251 42.3311 57.3421C42.3292 57.3567 42.3237 57.3695 42.3256 57.3859C42.3329 57.4971 42.4282 57.581 42.5401 57.5756C42.6519 57.5683 42.7362 57.4734 42.7307 57.3622C42.727 57.3111 42.7032 57.2656 42.6684 57.2309C42.628 57.1926 42.5749 57.1689 42.5162 57.1725H42.5144Z" fill="#91D7EC" />
                <path id="Vector_862" d="M43.8418 57.0923C43.73 57.0996 43.6456 57.1944 43.6511 57.3057C43.6585 57.4169 43.7538 57.5008 43.8656 57.4953C43.9774 57.488 44.0618 57.3932 44.0563 57.2819C44.0489 57.1707 43.9536 57.0868 43.8418 57.0923Z" fill="#91D7EC" />
                <path id="Vector_863" d="M35.9002 55.6407C35.9424 55.5368 35.8911 55.4201 35.7866 55.3781C35.6821 55.3362 35.5647 55.3873 35.5226 55.4912C35.4804 55.5952 35.5317 55.7119 35.6362 55.7538C35.7407 55.7957 35.8581 55.7447 35.9002 55.6407Z" fill="#91D7EC" />
                <path id="Vector_864" d="M37.1393 56.1076C37.1668 56 37.1008 55.8906 36.9926 55.8633C36.8845 55.8359 36.7745 55.9016 36.747 56.0092C36.7195 56.1167 36.7855 56.2262 36.8936 56.2535C37.0018 56.2809 37.1118 56.2152 37.1393 56.1076Z" fill="#91D7EC" />
                <path id="Vector_865" d="M38.263 56.1824C38.153 56.166 38.0486 56.2407 38.0321 56.3501C38.0156 56.4596 38.0907 56.5635 38.2007 56.5799C38.3107 56.5963 38.4152 56.5216 38.4317 56.4121C38.4482 56.3027 38.373 56.1988 38.263 56.1824Z" fill="#91D7EC" />
                <path id="Vector_866" d="M39.5626 56.3866C39.4508 56.3757 39.3518 56.4577 39.3408 56.5671C39.3298 56.6784 39.4123 56.7768 39.5223 56.7878C39.6323 56.7987 39.7331 56.7167 39.7441 56.6073C39.7551 56.496 39.6726 56.3975 39.5626 56.3866Z" fill="#91D7EC" />
                <path id="Vector_867" d="M40.877 56.5124C40.7652 56.5051 40.6699 56.5908 40.6625 56.702C40.6552 56.8133 40.7414 56.9081 40.8532 56.9154C40.965 56.9227 41.0604 56.837 41.0677 56.7258C41.075 56.6145 40.9889 56.5197 40.877 56.5124Z" fill="#91D7EC" />
                <path id="Vector_868" d="M42.1898 56.9957C42.3022 56.9957 42.3933 56.905 42.3933 56.7932C42.3933 56.6814 42.3022 56.5908 42.1898 56.5908C42.0774 56.5908 41.9863 56.6814 41.9863 56.7932C41.9863 56.905 42.0774 56.9957 42.1898 56.9957Z" fill="#91D7EC" />
                <path id="Vector_869" d="M43.5245 56.6456C43.4127 56.6419 43.3192 56.7294 43.3155 56.8407C43.3137 56.8954 43.3339 56.9446 43.3669 56.9811C43.4017 57.0212 43.453 57.0467 43.5099 57.0486C43.6217 57.0522 43.7152 56.9647 43.7189 56.8534C43.7189 56.8516 43.7189 56.8498 43.7189 56.8462C43.7189 56.7386 43.6345 56.6474 43.5245 56.6437V56.6456Z" fill="#91D7EC" />
                <path id="Vector_870" d="M44.8517 56.693C44.7398 56.6893 44.6464 56.7769 44.6427 56.8881C44.639 56.9993 44.727 57.0923 44.8388 57.096C44.9507 57.0996 45.0442 57.0121 45.0478 56.9009C45.0515 56.7896 44.9635 56.6966 44.8517 56.693Z" fill="#91D7EC" />
                <path id="Vector_871" d="M37.3192 52.8945C37.2367 52.9692 37.2294 53.0969 37.3045 53.1789C37.3797 53.261 37.508 53.2683 37.5905 53.1935C37.673 53.1188 37.6803 52.9911 37.6052 52.909C37.53 52.827 37.4017 52.8197 37.3192 52.8945Z" fill="#91D7EC" />
                <path id="Vector_872" d="M38.5089 54.1418C38.5731 54.0506 38.5493 53.9248 38.4576 53.861C38.3659 53.7971 38.2395 53.8208 38.1753 53.912C38.1111 54.0032 38.135 54.129 38.2266 54.1928C38.3183 54.2567 38.4448 54.233 38.5089 54.1418Z" fill="#91D7EC" />
                <path id="Vector_873" d="M39.6196 54.8621C39.6673 54.7618 39.6233 54.6414 39.5206 54.594C39.4198 54.5466 39.2988 54.5904 39.2511 54.6925C39.2035 54.7928 39.2475 54.9131 39.3501 54.9605C39.451 55.008 39.572 54.9642 39.6196 54.8621Z" fill="#91D7EC" />
                <path id="Vector_874" d="M40.8316 55.3964C40.8664 55.2906 40.8077 55.1776 40.7014 55.1429C40.5951 55.1083 40.4814 55.1666 40.4466 55.2724C40.4117 55.3782 40.4704 55.4912 40.5767 55.5259C40.6831 55.5605 40.7967 55.5022 40.8316 55.3964Z" fill="#91D7EC" />
                <path id="Vector_875" d="M42.1001 55.7848C42.1258 55.6772 42.058 55.5678 41.948 55.5423C41.8398 55.5167 41.7298 55.5842 41.7042 55.6936C41.6785 55.8012 41.7463 55.9106 41.8563 55.9362C41.9645 55.9617 42.0745 55.8942 42.1001 55.7848Z" fill="#91D7EC" />
                <path id="Vector_876" d="M43.2311 55.8396C43.1211 55.8195 43.0166 55.8943 42.9964 56.0037C42.9763 56.1131 43.0514 56.217 43.1614 56.2371C43.2714 56.2572 43.3759 56.1824 43.3961 56.073C43.4162 55.9636 43.3411 55.8596 43.2311 55.8396Z" fill="#91D7EC" />
                <path id="Vector_877" d="M44.5326 56.0675C44.4227 56.051 44.32 56.1276 44.3035 56.2389C44.287 56.3483 44.364 56.4504 44.4758 56.4668C44.5858 56.4832 44.6885 56.4066 44.705 56.2954C44.7215 56.186 44.6445 56.0839 44.5326 56.0675Z" fill="#91D7EC" />
                <path id="Vector_878" d="M45.8471 56.2553C45.7371 56.2389 45.6344 56.3155 45.6179 56.4267C45.6014 56.5362 45.6784 56.6383 45.7903 56.6547C45.9021 56.6711 46.0029 56.5945 46.0194 56.4833C46.0359 56.3739 45.9589 56.2717 45.8471 56.2553Z" fill="#91D7EC" />
                <path id="Vector_879" d="M39.8011 50.9688C39.9074 50.9359 39.9679 50.8229 39.9349 50.7171C39.9019 50.6113 39.7882 50.5512 39.6819 50.584C39.5756 50.6168 39.5151 50.7299 39.5481 50.8356C39.5811 50.9414 39.6947 51.0016 39.8011 50.9688Z" fill="#91D7EC" />
                <path id="Vector_880" d="M40.021 51.8696C39.9293 51.9335 39.9055 52.0575 39.9678 52.1505C40.032 52.2416 40.1567 52.2654 40.2502 52.2033C40.3418 52.1395 40.3657 52.0155 40.3033 51.9225C40.2392 51.8313 40.1145 51.8076 40.021 51.8696Z" fill="#91D7EC" />
                <path id="Vector_881" d="M41.0385 53.261C41.1136 53.1771 41.1063 53.0513 41.022 52.9765C40.9376 52.9018 40.8111 52.9091 40.736 52.993C40.6608 53.0768 40.6681 53.2027 40.7525 53.2774C40.8368 53.3522 40.9633 53.3449 41.0385 53.261Z" fill="#91D7EC" />
                <path id="Vector_882" d="M41.7738 54.1764C41.8691 54.2348 41.9938 54.2038 42.0524 54.109C42.1111 54.0141 42.0799 53.8901 41.9846 53.8318C41.8893 53.7734 41.7646 53.8044 41.706 53.8993C41.6473 53.9941 41.6785 54.1181 41.7738 54.1764Z" fill="#91D7EC" />
                <path id="Vector_883" d="M43.2018 54.7709C43.2458 54.6688 43.2 54.5503 43.0973 54.5047C42.9947 54.4609 42.8755 54.5065 42.8297 54.6086C42.7857 54.7108 42.8315 54.8293 42.9342 54.8749C43.0368 54.9186 43.156 54.8731 43.2018 54.7709Z" fill="#91D7EC" />
                <path id="Vector_884" d="M44.4245 55.2815C44.4593 55.1758 44.4025 55.0609 44.2962 55.0262C44.1899 54.9916 44.0744 55.0481 44.0395 55.1539C44.0047 55.2597 44.0615 55.3745 44.1679 55.4092C44.2742 55.4438 44.3897 55.3873 44.4245 55.2815Z" fill="#91D7EC" />
                <path id="Vector_885" d="M45.5446 55.442C45.4365 55.4128 45.3246 55.4767 45.2971 55.5842C45.2678 55.6918 45.332 55.8031 45.4401 55.8304C45.5483 55.8596 45.6601 55.7958 45.6876 55.6882C45.717 55.5806 45.6528 55.4694 45.5446 55.442Z" fill="#91D7EC" />
                <path id="Vector_886" d="M46.8278 55.7812C46.7197 55.752 46.6078 55.8158 46.5803 55.9234C46.551 56.031 46.6152 56.1422 46.7233 56.1696C46.8315 56.1988 46.9433 56.1349 46.9708 56.0274C47.0002 55.9198 46.936 55.8085 46.8278 55.7812Z" fill="#91D7EC" />
                <path id="Vector_887" d="M42.2961 49.1434C42.4079 49.1488 42.5032 49.065 42.5106 48.9537C42.5161 48.8425 42.4317 48.7477 42.3199 48.7404C42.2081 48.7331 42.1127 48.8188 42.1054 48.93C42.0981 49.0413 42.1842 49.1361 42.2961 49.1434Z" fill="#91D7EC" />
                <path id="Vector_888" d="M42.2872 50.4563C42.3953 50.4272 42.4595 50.3159 42.4302 50.2083C42.4008 50.1007 42.289 50.0369 42.1809 50.0661C42.0727 50.0953 42.0085 50.2065 42.0379 50.3141C42.0672 50.4217 42.179 50.4855 42.2872 50.4563Z" fill="#91D7EC" />
                <path id="Vector_889" d="M42.4741 51.3645C42.3788 51.4229 42.3495 51.5469 42.4081 51.6417C42.4668 51.7365 42.5915 51.7657 42.6868 51.7073C42.7821 51.649 42.8114 51.525 42.7528 51.4302C42.6941 51.3353 42.5695 51.3062 42.4741 51.3645Z" fill="#91D7EC" />
                <path id="Vector_890" d="M43.1304 52.5188C43.0516 52.5972 43.0516 52.7249 43.1304 52.8033C43.2092 52.8817 43.3376 52.8817 43.4164 52.8033C43.4952 52.7249 43.4952 52.5972 43.4164 52.5188C43.3376 52.4404 43.2092 52.4404 43.1304 52.5188Z" fill="#91D7EC" />
                <path id="Vector_891" d="M44.3786 53.7114C44.4427 53.6203 44.4207 53.4944 44.3273 53.4306C44.2356 53.3668 44.1091 53.3887 44.0449 53.4817C43.9808 53.5728 44.0028 53.6987 44.0963 53.7625C44.1879 53.8263 44.3144 53.8044 44.3786 53.7114Z" fill="#91D7EC" />
                <path id="Vector_892" d="M45.4821 54.4463C45.5335 54.3478 45.495 54.2257 45.396 54.1746C45.297 54.1235 45.1742 54.1618 45.1228 54.2603C45.0715 54.3588 45.11 54.481 45.209 54.532C45.308 54.5831 45.4308 54.5448 45.4821 54.4463Z" fill="#91D7EC" />
                <path id="Vector_893" d="M46.5583 54.7746C46.4538 54.7326 46.3365 54.7819 46.2943 54.884C46.2522 54.9879 46.3017 55.1046 46.4043 55.1466C46.507 55.1885 46.6262 55.1393 46.6683 55.0372C46.7105 54.9332 46.661 54.8165 46.5583 54.7746Z" fill="#91D7EC" />
                <path id="Vector_894" d="M47.7869 55.2742C47.6824 55.2322 47.565 55.2815 47.5229 55.3836C47.4807 55.4857 47.5302 55.6043 47.6329 55.6462C47.7373 55.6881 47.8547 55.6389 47.8968 55.5368C47.939 55.4347 47.8895 55.3161 47.7869 55.2742Z" fill="#91D7EC" />
                <path id="Vector_895" d="M44.9729 47.3344C44.8665 47.2979 44.7511 47.3544 44.7162 47.4602C44.6796 47.566 44.7364 47.6809 44.8427 47.7155C44.949 47.752 45.0645 47.6955 45.0994 47.5897C45.136 47.4839 45.0792 47.369 44.9729 47.3344Z" fill="#91D7EC" />
                <path id="Vector_896" d="M44.474 48.9775C44.5858 48.9811 44.6793 48.8918 44.6811 48.7805C44.6848 48.6693 44.595 48.5763 44.4831 48.5744C44.3713 48.5708 44.2778 48.6602 44.276 48.7714C44.2723 48.8826 44.3621 48.9756 44.474 48.9775Z" fill="#91D7EC" />
                <path id="Vector_897" d="M44.5033 50.2904C44.6115 50.2594 44.6738 50.1482 44.6426 50.0406C44.6115 49.933 44.4997 49.871 44.3915 49.902C44.2833 49.933 44.221 50.0442 44.2522 50.1518C44.2833 50.2594 44.3952 50.3214 44.5033 50.2904Z" fill="#91D7EC" />
                <path id="Vector_898" d="M44.7049 51.1931C44.6096 51.2514 44.5785 51.3754 44.6371 51.4702C44.6958 51.5651 44.8204 51.5961 44.9158 51.5377C45.0111 51.4794 45.0423 51.3553 44.9836 51.2605C44.9249 51.1657 44.8003 51.1347 44.7049 51.1931Z" fill="#91D7EC" />
                <path id="Vector_899" d="M45.3578 52.351C45.2771 52.4276 45.2735 52.5553 45.3504 52.6355C45.4274 52.7157 45.5558 52.7194 45.6364 52.6428C45.7171 52.5662 45.7208 52.4385 45.6438 52.3583C45.5668 52.2781 45.4384 52.2744 45.3578 52.351Z" fill="#91D7EC" />
                <path id="Vector_900" d="M46.573 53.5747C46.6408 53.4853 46.6225 53.3595 46.5327 53.292C46.4428 53.2245 46.3163 53.2428 46.2485 53.3321C46.1807 53.4215 46.199 53.5473 46.2888 53.6148C46.3787 53.6822 46.5052 53.664 46.573 53.5747Z" fill="#91D7EC" />
                <path id="Vector_901" d="M47.5757 54.0725C47.4786 54.016 47.3558 54.0506 47.2989 54.1455C47.2421 54.2403 47.2769 54.3643 47.3722 54.4208C47.4676 54.4774 47.5922 54.4427 47.6491 54.3479C47.7059 54.2531 47.6711 54.129 47.5757 54.0725Z" fill="#91D7EC" />
                <path id="Vector_902" d="M48.7252 54.7326C48.628 54.6761 48.5052 54.7107 48.4483 54.8056C48.3915 54.9004 48.4263 55.0244 48.5217 55.0809C48.6188 55.1374 48.7417 55.1028 48.7985 55.008C48.8553 54.9113 48.8205 54.7891 48.7252 54.7326Z" fill="#91D7EC" />
                <path id="Vector_903" d="M47.585 46.5266C47.6418 46.4299 47.6088 46.3077 47.5117 46.2512C47.4145 46.1947 47.2917 46.2275 47.2349 46.3241C47.178 46.4208 47.211 46.543 47.3082 46.5995C47.4054 46.656 47.5282 46.6232 47.585 46.5266Z" fill="#91D7EC" />
                <path id="Vector_904" d="M46.6904 47.7611C46.7985 47.7903 46.9104 47.7247 46.9379 47.6171C46.9672 47.5095 46.9012 47.3982 46.793 47.3709C46.6849 47.3417 46.573 47.4074 46.5456 47.515C46.5162 47.6225 46.5822 47.7338 46.6904 47.7611Z" fill="#91D7EC" />
                <path id="Vector_905" d="M46.4098 49.0449C46.5216 49.0413 46.6096 48.9483 46.6059 48.837C46.6023 48.7258 46.5088 48.6382 46.3969 48.6419C46.2851 48.6455 46.1971 48.7385 46.2008 48.8498C46.2045 48.961 46.298 49.0486 46.4098 49.0449Z" fill="#91D7EC" />
                <path id="Vector_906" d="M46.3844 49.9731C46.278 50.0077 46.2194 50.1208 46.2542 50.2265C46.289 50.3323 46.4027 50.3907 46.509 50.356C46.6153 50.3214 46.674 50.2083 46.6392 50.1025C46.6043 49.9968 46.4907 49.9384 46.3844 49.9731Z" fill="#91D7EC" />
                <path id="Vector_907" d="M46.749 51.2496C46.6537 51.308 46.6244 51.4338 46.6849 51.5268C46.7454 51.6198 46.87 51.6508 46.9635 51.5906C47.0588 51.5323 47.0882 51.4065 47.0277 51.3135C46.969 51.2186 46.8425 51.1895 46.749 51.2496Z" fill="#91D7EC" />
                <path id="Vector_908" d="M47.4217 52.393C47.3411 52.4696 47.3356 52.5972 47.4126 52.6775C47.4896 52.7577 47.6179 52.7632 47.6986 52.6866C47.7792 52.61 47.7847 52.4824 47.7077 52.4021C47.6307 52.3219 47.5024 52.3164 47.4217 52.393Z" fill="#91D7EC" />
                <path id="Vector_909" d="M48.3108 53.3777C48.2412 53.4653 48.2577 53.5929 48.3457 53.6604C48.4337 53.7297 48.562 53.7133 48.6298 53.6257C48.6995 53.5382 48.683 53.4106 48.595 53.3431C48.507 53.2738 48.3787 53.2902 48.3108 53.3777Z" fill="#91D7EC" />
                <path id="Vector_910" d="M49.3543 54.1946C49.2846 54.2822 49.3011 54.4098 49.3891 54.4773C49.4771 54.5466 49.6055 54.5302 49.6733 54.4427C49.7429 54.3551 49.7264 54.2275 49.6384 54.16C49.5505 54.0925 49.4221 54.1071 49.3543 54.1946Z" fill="#91D7EC" />
                <path id="Vector_911" d="M49.9153 45.6731C49.985 45.5856 49.9703 45.4598 49.8823 45.3905C49.7943 45.3212 49.6678 45.3358 49.5982 45.4233C49.5285 45.5108 49.5432 45.6367 49.6312 45.706C49.7192 45.7753 49.8457 45.7607 49.9153 45.6731Z" fill="#91D7EC" />
                <path id="Vector_912" d="M49.0187 46.4026C48.9179 46.3552 48.7969 46.3989 48.7492 46.4992C48.7016 46.5995 48.7456 46.7199 48.8464 46.7673C48.9472 46.8147 49.0682 46.7709 49.1159 46.6706C49.1635 46.5703 49.1195 46.45 49.0187 46.4026Z" fill="#91D7EC" />
                <path id="Vector_913" d="M48.3314 47.9781C48.4414 47.9982 48.5459 47.9252 48.5661 47.814C48.5862 47.7046 48.5129 47.6006 48.4011 47.5806C48.2911 47.5605 48.1866 47.6335 48.1664 47.7447C48.1463 47.8541 48.2196 47.9581 48.3314 47.9781Z" fill="#91D7EC" />
                <path id="Vector_914" d="M48.3384 49.0613C48.3274 48.9501 48.2284 48.8698 48.1166 48.8808C48.0047 48.8917 47.9241 48.9902 47.9351 49.1014C47.9461 49.2127 48.0451 49.2929 48.1569 49.2819C48.2687 49.271 48.3494 49.1725 48.3384 49.0613Z" fill="#91D7EC" />
                <path id="Vector_915" d="M48.4595 50.325C48.4192 50.2211 48.3037 50.1682 48.1992 50.2083C48.0947 50.2484 48.0415 50.3633 48.0819 50.4673C48.1222 50.5712 48.2377 50.6241 48.3422 50.584C48.4467 50.5439 48.4998 50.429 48.4595 50.325Z" fill="#91D7EC" />
                <path id="Vector_916" d="M48.628 51.4611C48.5345 51.5231 48.5088 51.6471 48.5693 51.7401C48.6298 51.8331 48.7563 51.8587 48.8498 51.7985C48.9433 51.7365 48.969 51.6125 48.9085 51.5195C48.8461 51.4265 48.7215 51.4009 48.628 51.4611Z" fill="#91D7EC" />
                <path id="Vector_917" d="M49.3304 52.5881C49.2498 52.6647 49.2461 52.7923 49.3231 52.8725C49.4001 52.9528 49.5284 52.9564 49.6091 52.8798C49.6897 52.8033 49.6934 52.6756 49.6164 52.5954C49.5394 52.5151 49.4111 52.5115 49.3304 52.5881Z" fill="#91D7EC" />
                <path id="Vector_918" d="M50.2416 53.5473C50.1609 53.6239 50.1572 53.7515 50.2342 53.8318C50.3112 53.912 50.4396 53.9157 50.5202 53.8391C50.6009 53.7625 50.6046 53.6348 50.5276 53.5546C50.4506 53.4744 50.3222 53.4707 50.2416 53.5473Z" fill="#91D7EC" />
                <path id="Vector_919" d="M52.0801 44.9692C52.1589 44.889 52.1571 44.7614 52.0764 44.6848C51.9957 44.6063 51.8674 44.6082 51.7904 44.6884C51.7116 44.7686 51.7134 44.8963 51.7941 44.9729C51.8747 45.0513 52.0031 45.0495 52.0801 44.9692Z" fill="#91D7EC" />
                <path id="Vector_920" d="M51.18 45.8865C51.2423 45.7935 51.2148 45.6677 51.1213 45.6075C51.0278 45.5473 50.9013 45.5728 50.8408 45.6658C50.7803 45.7588 50.806 45.8847 50.8995 45.9448C50.993 46.0068 51.1195 45.9795 51.18 45.8865Z" fill="#91D7EC" />
                <path id="Vector_921" d="M50.4722 46.9478C50.5107 46.8439 50.4557 46.7272 50.3512 46.6889C50.2467 46.6506 50.1294 46.7053 50.0909 46.8092C50.0524 46.9132 50.1074 47.0299 50.2119 47.0682C50.3164 47.1065 50.4337 47.0518 50.4722 46.9478Z" fill="#91D7EC" />
                <path id="Vector_922" d="M50.0249 48.1735C50.0546 48.0657 49.9908 47.9544 49.8824 47.9248C49.774 47.8953 49.6621 47.9587 49.6324 48.0666C49.6027 48.1744 49.6665 48.2857 49.7749 48.3153C49.8833 48.3448 49.9952 48.2813 50.0249 48.1735Z" fill="#91D7EC" />
                <path id="Vector_923" d="M49.7462 49.6339C49.8562 49.6157 49.9296 49.5099 49.9112 49.4005C49.8929 49.2911 49.7866 49.2181 49.6766 49.2364C49.5666 49.2546 49.4933 49.3604 49.5116 49.4698C49.5299 49.5792 49.6363 49.6521 49.7462 49.6339Z" fill="#91D7EC" />
                <path id="Vector_924" d="M49.8566 50.553C49.7539 50.5967 49.7063 50.7153 49.7503 50.8174C49.7943 50.9195 49.9134 50.9669 50.0161 50.9232C50.1187 50.8794 50.1664 50.7609 50.1224 50.6587C50.0784 50.5566 49.9593 50.5092 49.8566 50.553Z" fill="#91D7EC" />
                <path id="Vector_925" d="M50.3497 51.7858C50.258 51.8496 50.2342 51.9754 50.2983 52.0666C50.3625 52.1578 50.489 52.1815 50.5807 52.1176C50.6723 52.0538 50.6962 51.928 50.632 51.8368C50.5678 51.7456 50.4413 51.7219 50.3497 51.7858Z" fill="#91D7EC" />
                <path id="Vector_926" d="M51.105 52.8708C51.0134 52.9346 50.9895 53.0604 51.0537 53.1516C51.1179 53.2428 51.2444 53.2665 51.336 53.2027C51.4277 53.1388 51.4515 53.013 51.3874 52.9218C51.3232 52.8307 51.1967 52.807 51.105 52.8708Z" fill="#91D7EC" />
                <path id="Vector_927" d="M54.1056 44.0848C54.0323 44.0009 53.904 43.9936 53.8197 44.0666C53.7353 44.1395 53.728 44.2672 53.8013 44.351C53.8747 44.4349 54.003 44.4422 54.0873 44.3693C54.1716 44.2963 54.179 44.1687 54.1056 44.0848Z" fill="#91D7EC" />
                <path id="Vector_928" d="M53.1123 45.2209C53.1838 45.1352 53.1709 45.0075 53.0848 44.9364C52.9986 44.8653 52.8703 44.8781 52.7988 44.9638C52.7273 45.0495 52.7401 45.1771 52.8263 45.2482C52.9124 45.3194 53.0408 45.3066 53.1123 45.2209Z" fill="#91D7EC" />
                <path id="Vector_929" d="M52.2892 46.2038C52.3424 46.1053 52.3039 45.9831 52.2067 45.9302C52.1077 45.8774 51.9849 45.9157 51.9317 46.0123C51.8786 46.109 51.9171 46.233 52.0142 46.2858C52.1132 46.3387 52.236 46.3004 52.2892 46.2038Z" fill="#91D7EC" />
                <path id="Vector_930" d="M51.5356 47.0791C51.4274 47.0517 51.3174 47.1155 51.2881 47.2231C51.2606 47.3307 51.3248 47.4401 51.4329 47.4693C51.5411 47.4967 51.6511 47.4328 51.6804 47.3253C51.7097 47.2177 51.6437 47.1083 51.5356 47.0791Z" fill="#91D7EC" />
                <path id="Vector_931" d="M50.9434 48.5507C50.9434 48.662 51.0332 48.7532 51.145 48.7532C51.2568 48.7532 51.3485 48.6638 51.3485 48.5526C51.3485 48.4413 51.2587 48.3502 51.1468 48.3502C51.035 48.3502 50.9434 48.4395 50.9434 48.5507Z" fill="#91D7EC" />
                <path id="Vector_932" d="M51.3379 49.8254C51.3122 49.7178 51.2022 49.6503 51.0941 49.6777C50.9859 49.705 50.9181 49.8126 50.9456 49.9202C50.9712 50.0278 51.0812 50.0953 51.1894 50.0679C51.2976 50.0424 51.3654 49.933 51.3379 49.8254Z" fill="#91D7EC" />
                <path id="Vector_933" d="M51.3652 50.9761C51.2644 51.0253 51.2222 51.1457 51.2717 51.246C51.3212 51.3463 51.4422 51.3882 51.543 51.339C51.6439 51.2897 51.686 51.1694 51.6365 51.0691C51.587 50.9688 51.466 50.9268 51.3652 50.9761Z" fill="#91D7EC" />
                <path id="Vector_934" d="M51.9443 52.1632C51.8435 52.2125 51.8013 52.3328 51.8508 52.4331C51.9003 52.5334 52.0213 52.5753 52.1221 52.5261C52.223 52.4769 52.2651 52.3565 52.2156 52.2562C52.1661 52.1559 52.0451 52.114 51.9443 52.1632Z" fill="#91D7EC" />
                <path id="Vector_935" d="M55.6551 43.8131C55.7229 43.9006 55.8512 43.9171 55.9392 43.8478C56.0272 43.7803 56.0437 43.6526 55.9741 43.5651C55.9062 43.4776 55.7779 43.4612 55.6899 43.5305C55.6019 43.5979 55.5854 43.7256 55.6551 43.8131Z" fill="#91D7EC" />
                <path id="Vector_936" d="M54.6227 44.3583C54.5438 44.4367 54.5457 44.5644 54.6245 44.6428C54.7033 44.7212 54.8317 44.7194 54.9105 44.641C54.9893 44.5626 54.9875 44.4349 54.9086 44.3565C54.8298 44.2781 54.7015 44.2799 54.6227 44.3583Z" fill="#91D7EC" />
                <path id="Vector_937" d="M53.6656 45.323C53.6015 45.4142 53.6235 45.54 53.7151 45.6039C53.8068 45.6677 53.9333 45.6458 53.9975 45.5546C54.0616 45.4634 54.0396 45.3376 53.948 45.2738C53.8563 45.21 53.7298 45.2318 53.6656 45.323Z" fill="#91D7EC" />
                <path id="Vector_938" d="M53.2609 46.6013C53.3049 46.4992 53.2573 46.3807 53.1528 46.3369C53.0501 46.2931 52.931 46.3405 52.887 46.4445C52.843 46.5484 52.8906 46.6651 52.9951 46.7089C53.0978 46.7527 53.2169 46.7052 53.2609 46.6013Z" fill="#91D7EC" />
                <path id="Vector_939" d="M52.5882 47.5404C52.4782 47.5222 52.3737 47.5952 52.3553 47.7064C52.337 47.8176 52.4103 47.9198 52.5222 47.938C52.634 47.9562 52.7367 47.8833 52.755 47.772C52.7733 47.6626 52.7 47.5587 52.5882 47.5404Z" fill="#91D7EC" />
                <path id="Vector_940" d="M52.5368 49.0267C52.5295 48.9154 52.4323 48.8315 52.3205 48.8406C52.2087 48.8479 52.1243 48.9446 52.1335 49.0558C52.1408 49.1671 52.238 49.2509 52.3498 49.2418C52.4616 49.2345 52.546 49.1379 52.5368 49.0267Z" fill="#91D7EC" />
                <path id="Vector_941" d="M52.3699 50.1646C52.2636 50.1974 52.2031 50.3105 52.2361 50.4163C52.2691 50.522 52.3827 50.5822 52.4891 50.5494C52.5954 50.5166 52.6559 50.4035 52.6229 50.2977C52.5899 50.192 52.4762 50.1318 52.3699 50.1646Z" fill="#91D7EC" />
                <path id="Vector_942" d="M52.7586 51.4283C52.6522 51.4611 52.5917 51.5742 52.6247 51.6799C52.6577 51.7857 52.7714 51.8459 52.8777 51.8131C52.9841 51.7802 53.0446 51.6672 53.0116 51.5614C52.9786 51.4556 52.8649 51.3955 52.7586 51.4283Z" fill="#91D7EC" />
                <path id="Vector_943" d="M57.4109 43.049C57.3193 43.1128 57.2973 43.2386 57.3614 43.3298C57.4256 43.421 57.5521 43.4429 57.6438 43.3791C57.7354 43.3152 57.7574 43.1894 57.6933 43.0982C57.6291 43.0071 57.5026 42.9852 57.4109 43.049Z" fill="#91D7EC" />
                <path id="Vector_944" d="M56.5731 44.1249C56.6575 44.0519 56.6648 43.9243 56.5915 43.8404C56.5181 43.7565 56.3898 43.7492 56.3055 43.8222C56.2212 43.8951 56.2138 44.0228 56.2872 44.1067C56.3605 44.1905 56.4888 44.1978 56.5731 44.1249Z" fill="#91D7EC" />
                <path id="Vector_945" d="M55.5725 44.6902C55.4882 44.6173 55.3599 44.6282 55.2866 44.7121C55.2132 44.796 55.2242 44.9237 55.3086 44.9966C55.3929 45.0695 55.5212 45.0586 55.5945 44.9747C55.6679 44.8908 55.6569 44.7632 55.5725 44.6902Z" fill="#91D7EC" />
                <path id="Vector_946" d="M54.4762 46.0214C54.5733 46.078 54.6962 46.0451 54.753 45.9485C54.8098 45.8518 54.7768 45.7297 54.6797 45.6731C54.5825 45.6166 54.4597 45.6494 54.4028 45.7461C54.346 45.8427 54.379 45.9649 54.4762 46.0214Z" fill="#91D7EC" />
                <path id="Vector_947" d="M53.9739 46.7964C53.8675 46.7618 53.7539 46.8201 53.719 46.9259C53.6842 47.0317 53.7429 47.1447 53.8492 47.1794C53.9555 47.214 54.0692 47.1557 54.104 47.0499C54.1388 46.9441 54.0802 46.8311 53.9739 46.7964Z" fill="#91D7EC" />
                <path id="Vector_948" d="M53.5156 48.0438C53.4038 48.0347 53.3066 48.1167 53.2956 48.228C53.2865 48.3392 53.3689 48.4359 53.4808 48.4468C53.5926 48.4559 53.6898 48.3739 53.7008 48.2626C53.7099 48.1514 53.6274 48.0547 53.5156 48.0438Z" fill="#91D7EC" />
                <path id="Vector_949" d="M53.3562 49.3604C53.2463 49.3768 53.1693 49.4789 53.1839 49.5883C53.2004 49.6977 53.3031 49.7743 53.4131 49.7597C53.5231 49.7433 53.6001 49.6412 53.5854 49.5318C53.5689 49.4224 53.4662 49.3458 53.3562 49.3604Z" fill="#91D7EC" />
                <path id="Vector_950" d="M53.5433 50.6679C53.4333 50.6843 53.3563 50.7865 53.3709 50.8959C53.3874 51.0053 53.4901 51.0819 53.6001 51.0673C53.7101 51.0527 53.7871 50.9487 53.7724 50.8393C53.7577 50.7299 53.6532 50.6533 53.5433 50.6679Z" fill="#91D7EC" />
                <path id="Vector_951" d="M59.2701 42.6679C59.2096 42.5749 59.0849 42.5475 58.9896 42.6059C58.9456 42.6333 58.9181 42.677 58.9053 42.7226C58.9456 42.739 58.9823 42.7664 59.0043 42.8065C59.0318 42.8539 59.0373 42.9086 59.0226 42.9578C59.0813 42.9816 59.1491 42.9816 59.2078 42.9451C59.2114 42.9433 59.2133 42.9396 59.2151 42.9378C59.2298 42.9104 59.2481 42.8867 59.2756 42.8667C59.3086 42.8047 59.3104 42.7299 59.2701 42.6661V42.6679Z" fill="#91D7EC" />
                <path id="Vector_952" d="M57.8183 43.607C57.8183 43.607 57.8183 43.6107 57.8201 43.6107C57.888 43.6982 58.0163 43.7146 58.1043 43.6472C58.1923 43.5797 58.2088 43.452 58.1409 43.3645C58.0969 43.308 58.0291 43.2843 57.9631 43.2916C57.9265 43.2952 57.888 43.3043 57.8568 43.3299C57.7706 43.3973 57.7541 43.5213 57.8183 43.6089V43.607Z" fill="#91D7EC" />
                <path id="Vector_953" d="M56.7878 44.4404C56.8667 44.5188 56.995 44.5206 57.0738 44.4404C57.1526 44.3602 57.1545 44.2343 57.0738 44.1559C56.995 44.0775 56.8667 44.0757 56.7878 44.1559C56.709 44.2343 56.7072 44.362 56.7878 44.4404Z" fill="#91D7EC" />
                <path id="Vector_954" d="M55.8237 45.106C55.7577 45.1953 55.7761 45.3212 55.8659 45.3886C55.9557 45.4543 56.0822 45.4361 56.15 45.3467C56.2179 45.2573 56.1977 45.1315 56.1079 45.064C56.018 44.9966 55.8916 45.0166 55.8237 45.106Z" fill="#91D7EC" />
                <path id="Vector_955" d="M55.2844 46.1053C55.1836 46.0561 55.0626 46.0998 55.0131 46.2001C54.9636 46.3004 55.0076 46.4208 55.1084 46.47C55.2092 46.5193 55.3302 46.4755 55.3797 46.3752C55.4292 46.2749 55.3852 46.1545 55.2844 46.1053Z" fill="#91D7EC" />
                <path id="Vector_956" d="M54.6668 47.2815C54.5587 47.256 54.4487 47.3216 54.423 47.431C54.3973 47.5386 54.4633 47.648 54.5733 47.6736C54.6815 47.6991 54.7915 47.6334 54.8172 47.524C54.8428 47.4164 54.7768 47.307 54.6668 47.2815Z" fill="#91D7EC" />
                <path id="Vector_957" d="M54.3132 48.5616C54.2014 48.5616 54.1097 48.6492 54.1079 48.7604C54.1079 48.8717 54.1959 48.9628 54.3077 48.9647C54.4196 48.9647 54.5112 48.8771 54.5131 48.7659C54.5131 48.6547 54.4251 48.5635 54.3132 48.5616Z" fill="#91D7EC" />
                <path id="Vector_958" d="M54.2981 49.882C54.1863 49.882 54.0946 49.9695 54.0928 50.0807C54.0928 50.192 54.1808 50.2831 54.2926 50.285C54.4044 50.285 54.4961 50.1974 54.4979 50.0862C54.4979 49.975 54.4099 49.8838 54.2981 49.882Z" fill="#91D7EC" />
                <path id="Vector_959" d="M60.5091 42.2594C60.5732 42.2211 60.6484 42.2248 60.7107 42.2594C60.6539 42.1646 60.5311 42.1336 60.4358 42.1901C60.3386 42.2466 60.3074 42.3706 60.3643 42.4655C60.3826 42.4983 60.4119 42.5202 60.4413 42.5366C60.3844 42.4418 60.4156 42.3178 60.5109 42.2594H60.5091Z" fill="#91D7EC" />
                <path id="Vector_960" d="M59.3561 42.9487C59.4203 42.9031 59.5009 42.9031 59.5669 42.9359C59.5633 42.9305 59.5633 42.9232 59.5596 42.9177C59.4954 42.8265 59.3689 42.8028 59.2773 42.8666C59.2498 42.8849 59.2315 42.9104 59.2168 42.9378C59.182 43.0016 59.182 43.0818 59.2278 43.1456C59.2479 43.173 59.2736 43.193 59.3011 43.2076C59.2516 43.1183 59.2718 43.007 59.3579 42.9469L59.3561 42.9487Z" fill="#91D7EC" />
                <path id="Vector_961" d="M58.2762 43.7146C58.3385 43.6709 58.4155 43.669 58.4797 43.7C58.4724 43.6855 58.4669 43.6709 58.4559 43.6581C58.3825 43.5742 58.256 43.5633 58.1699 43.6362C58.0856 43.7092 58.0746 43.835 58.1479 43.9207C58.1681 43.9426 58.1919 43.959 58.2157 43.9718C58.1699 43.8842 58.1919 43.7748 58.2744 43.7165L58.2762 43.7146Z" fill="#91D7EC" />
                <path id="Vector_962" d="M57.1434 44.5097C57.0682 44.5917 57.0756 44.7194 57.1581 44.7942C57.1746 44.8087 57.1929 44.8179 57.213 44.827C57.2919 44.8616 57.3854 44.847 57.444 44.7796C57.5192 44.6975 57.5119 44.5699 57.4294 44.4951C57.4202 44.486 57.4074 44.4823 57.3964 44.475C57.3157 44.4258 57.2094 44.4367 57.1434 44.5097Z" fill="#91D7EC" />
                <path id="Vector_963" d="M56.5753 45.7351C56.6358 45.6421 56.6083 45.5163 56.5148 45.4561C56.4213 45.3959 56.2948 45.4233 56.2343 45.5163C56.1738 45.6093 56.2013 45.7351 56.2948 45.7953C56.3883 45.8555 56.5148 45.8281 56.5753 45.7351Z" fill="#91D7EC" />
                <path id="Vector_964" d="M55.763 46.5502C55.6585 46.5101 55.5412 46.5594 55.5008 46.6633C55.4605 46.7672 55.51 46.884 55.6145 46.9241C55.719 46.9642 55.8363 46.915 55.8766 46.811C55.917 46.7071 55.8675 46.5904 55.763 46.5502Z" fill="#91D7EC" />
                <path id="Vector_965" d="M55.0006 47.9344C54.9859 48.0256 55.0355 48.1076 55.1143 48.1459C55.1308 48.1532 55.1473 48.1623 55.1674 48.166C55.2774 48.1842 55.3819 48.1094 55.4003 48C55.4113 47.9362 55.3874 47.876 55.3453 47.8323C55.3159 47.8013 55.2793 47.7776 55.2334 47.7703C55.1234 47.752 55.0189 47.8268 55.0006 47.9362V47.9344Z" fill="#91D7EC" />
                <path id="Vector_966" d="M55.0188 49.0723C54.9088 49.054 54.8043 49.1288 54.786 49.2382C54.7676 49.3476 54.8428 49.4516 54.9528 49.4698C55.0628 49.488 55.1673 49.4133 55.1856 49.3038C55.2039 49.1944 55.1288 49.0905 55.0188 49.0723Z" fill="#91D7EC" />
                <path id="Vector_967" d="M61.7175 42.0041C61.69 41.995 61.6662 41.9785 61.646 41.9567C61.646 41.9895 61.6497 42.0241 61.668 42.0551C61.668 42.057 61.6717 42.0588 61.6717 42.0606C61.6827 42.0387 61.6973 42.0205 61.7175 42.0041Z" fill="#91D7EC" />
                <path id="Vector_968" d="M61.9188 41.9658C61.961 41.9804 61.9977 42.0078 62.0233 42.0497C62.0526 41.9932 62.0581 41.9239 62.0233 41.8619C62.0142 41.8455 61.9995 41.8327 61.9867 41.8199C61.9867 41.8765 61.961 41.9275 61.917 41.9658H61.9188Z" fill="#91D7EC" />
                <path id="Vector_969" d="M60.7182 42.6041C60.7182 42.6041 60.7072 42.6077 60.7017 42.6095C60.7622 42.6095 60.819 42.6369 60.8575 42.6861C60.8905 42.6241 60.8942 42.5475 60.8538 42.4837C60.8428 42.4655 60.8282 42.4545 60.8135 42.4418C60.8098 42.5056 60.7787 42.5694 60.72 42.6041H60.7182Z" fill="#91D7EC" />
                <path id="Vector_970" d="M60.6121 42.6296C60.5644 42.6296 60.5204 42.6132 60.4837 42.5822C60.4819 42.6223 60.4874 42.6624 60.5112 42.6989C60.5149 42.7043 60.5204 42.708 60.5241 42.7116C60.5387 42.6843 60.5589 42.6587 60.5864 42.6387C60.5937 42.6332 60.6047 42.6314 60.6121 42.6277V42.6296Z" fill="#91D7EC" />
                <path id="Vector_971" d="M59.7303 43.3973C59.7706 43.3298 59.7706 43.2405 59.7193 43.173C59.7065 43.1566 59.69 43.1438 59.6735 43.1329C59.668 43.1894 59.6405 43.2423 59.591 43.2769C59.5177 43.328 59.4242 43.3225 59.3563 43.2751C59.3508 43.3243 59.3618 43.3736 59.3948 43.4155C59.4022 43.4246 59.4113 43.4301 59.4187 43.4374C59.4315 43.4174 59.4443 43.3991 59.4645 43.3827C59.5452 43.3189 59.657 43.328 59.7303 43.3973Z" fill="#91D7EC" />
                <path id="Vector_972" d="M58.6597 44.1979C58.711 44.1213 58.7092 44.0192 58.6432 43.9499C58.6285 43.9334 58.6102 43.9243 58.5937 43.9134C58.5845 43.9626 58.557 44.01 58.513 44.041C58.4489 44.0866 58.3664 44.0885 58.3004 44.052C58.2894 44.1122 58.304 44.176 58.348 44.2234C58.3609 44.238 58.3774 44.2453 58.392 44.2544C58.3994 44.2435 58.403 44.2325 58.4122 44.2234C58.48 44.1559 58.5809 44.1486 58.6597 44.196V44.1979Z" fill="#91D7EC" />
                <path id="Vector_973" d="M57.6804 45.1188C57.6804 45.1188 57.6804 45.1188 57.6823 45.117C57.7519 45.0294 57.7391 44.9036 57.6511 44.8343C57.5631 44.765 57.4366 44.7778 57.367 44.8653C57.2973 44.9528 57.3101 45.0787 57.3981 45.148C57.4201 45.1662 57.4439 45.1771 57.4696 45.1844C57.5228 45.1206 57.6053 45.0969 57.6804 45.1188Z" fill="#91D7EC" />
                <path id="Vector_974" d="M56.8702 46.1162C56.9252 46.0196 56.8886 45.8956 56.7914 45.8427C56.7492 45.819 56.7016 45.8153 56.6557 45.8226C56.5989 45.8336 56.5457 45.8664 56.5164 45.9193C56.4871 45.9703 56.4853 46.0287 56.5036 46.0798C56.5182 46.1254 56.5494 46.1673 56.5952 46.1928C56.6392 46.2184 56.6887 46.222 56.7364 46.2111C56.7584 46.1965 56.7804 46.1874 56.8042 46.1819C56.8299 46.1655 56.8537 46.1436 56.8702 46.1144V46.1162Z" fill="#91D7EC" />
                <path id="Vector_975" d="M56.2399 47.2341C56.2748 47.1284 56.2143 47.0153 56.1079 46.9806C56.0016 46.946 55.888 47.0062 55.8531 47.1119C55.8183 47.2177 55.8788 47.3308 55.9851 47.3654C56.0915 47.4001 56.2051 47.3399 56.2399 47.2341Z" fill="#91D7EC" />
                <path id="Vector_976" d="M55.7046 48.2389C55.5983 48.2042 55.4846 48.2644 55.4498 48.3702C55.415 48.4759 55.4755 48.589 55.5818 48.6237C55.6881 48.6583 55.8018 48.5981 55.8366 48.4924C55.8715 48.3866 55.811 48.2735 55.7046 48.2389Z" fill="#91D7EC" />
                <path id="Vector_977" d="M63.1381 41.3841C63.1197 41.4042 63.0996 41.4206 63.0739 41.4315C63.0097 41.4625 62.9401 41.4516 62.8832 41.4187C62.8594 41.4461 62.8447 41.4789 62.8374 41.5154C62.9309 41.4844 63.0354 41.519 63.0812 41.6084C63.1032 41.6503 63.1069 41.6959 63.0977 41.7397C63.1069 41.736 63.1161 41.736 63.1252 41.7324C63.2242 41.6813 63.2645 41.561 63.2132 41.4607C63.1949 41.426 63.1674 41.4023 63.1381 41.3841Z" fill="#91D7EC" />
                <path id="Vector_978" d="M62.0234 42.0479C61.9996 42.0078 61.9611 41.9804 61.9189 41.964C61.9079 41.9749 61.8969 41.9859 61.8822 41.9932C61.8291 42.0205 61.7704 42.0205 61.7172 42.0023C61.6989 42.0187 61.6842 42.0369 61.6714 42.0588C61.6604 42.0807 61.6531 42.1044 61.6494 42.1299C61.7411 42.0935 61.8474 42.1226 61.8987 42.2102C61.9226 42.2485 61.9262 42.2922 61.9226 42.3324C61.9317 42.3287 61.9391 42.3287 61.9482 42.3232C62.0454 42.2685 62.0784 42.1445 62.0234 42.0479C62.0234 42.0479 62.0234 42.0479 62.0216 42.0461L62.0234 42.0479Z" fill="#91D7EC" />
                <path id="Vector_979" d="M60.856 42.6879C60.8175 42.6387 60.7607 42.6132 60.7002 42.6113C60.6709 42.6259 60.6415 42.6314 60.6104 42.6314C60.6012 42.635 60.592 42.6369 60.5847 42.6423C60.5572 42.6606 60.537 42.6861 60.5224 42.7153C60.5059 42.7463 60.4985 42.7809 60.4985 42.8174C60.5865 42.7736 60.6947 42.7973 60.7534 42.8794C60.7772 42.9122 60.7845 42.9505 60.7863 42.9888C60.7937 42.9852 60.8028 42.9833 60.8102 42.9779C60.9037 42.9159 60.9293 42.7919 60.867 42.6989C60.8652 42.6952 60.8597 42.6934 60.8578 42.6897L60.856 42.6879Z" fill="#91D7EC" />
                <path id="Vector_980" d="M59.7304 43.3973C59.6589 43.328 59.5452 43.3189 59.4646 43.3827C59.4462 43.3973 59.4316 43.4174 59.4187 43.4374C59.3931 43.4794 59.3857 43.5305 59.3949 43.5779C59.4774 43.5286 59.5856 43.5414 59.6516 43.6162C59.6754 43.6435 59.6864 43.6763 59.6937 43.7092C59.7029 43.7037 59.712 43.7019 59.7194 43.6964C59.8074 43.6271 59.8202 43.4995 59.7505 43.4137C59.745 43.4065 59.7377 43.4028 59.7304 43.3973Z" fill="#91D7EC" />
                <path id="Vector_981" d="M58.6596 44.1979C58.5808 44.1505 58.4781 44.1578 58.4121 44.2252C58.4029 44.2343 58.3993 44.2453 58.3919 44.2562C58.3553 44.3128 58.3443 44.3802 58.3699 44.4422C58.4469 44.3875 58.5514 44.3875 58.6229 44.4532C58.6468 44.4751 58.6614 44.5006 58.6724 44.5261C58.6816 44.5188 58.6926 44.5152 58.7018 44.5061C58.7806 44.4258 58.7788 44.2982 58.6999 44.2216C58.6889 44.2106 58.6743 44.2052 58.6614 44.196L58.6596 44.1979Z" fill="#91D7EC" />
                <path id="Vector_982" d="M57.6807 45.1187C57.6055 45.0969 57.5212 45.1206 57.4699 45.1844C57.468 45.188 57.4644 45.1899 57.4607 45.1917C57.4075 45.2628 57.413 45.3558 57.4607 45.4251C57.5285 45.3704 57.6238 45.3594 57.7008 45.4105C57.7228 45.4251 57.7393 45.4433 57.7522 45.4616C57.765 45.4506 57.7778 45.4415 57.7888 45.4287C57.8548 45.3394 57.8347 45.2117 57.7448 45.1479C57.7247 45.1333 57.7027 45.126 57.6807 45.1187Z" fill="#91D7EC" />
                <path id="Vector_983" d="M56.9656 46.5101C56.9656 46.5101 56.9766 46.5211 56.9821 46.5266C57.0004 46.5101 57.0169 46.4901 57.0279 46.4664C57.0774 46.3661 57.0353 46.2457 56.9344 46.1965C56.8923 46.1764 56.8464 46.1746 56.8043 46.1837C56.7804 46.1892 56.7566 46.1983 56.7364 46.2129C56.7071 46.233 56.6814 46.2567 56.6649 46.2895C56.6228 46.3752 56.6503 46.4718 56.7218 46.5302C56.7896 46.47 56.8886 46.4554 56.9674 46.5083L56.9656 46.5101Z" fill="#91D7EC" />
                <path id="Vector_984" d="M56.3536 47.3854C56.2528 47.3362 56.1318 47.3781 56.0823 47.4784C56.0328 47.5787 56.0749 47.6991 56.1758 47.7483C56.2766 47.7976 56.3976 47.7556 56.4471 47.6553C56.4966 47.555 56.4544 47.4347 56.3536 47.3854Z" fill="#91D7EC" />
                <path id="Vector_985" d="M64.0144 40.9519C63.9704 40.972 63.9411 41.0085 63.9209 41.0486C63.9649 41.0668 64.0052 41.0996 64.0272 41.1452C64.0547 41.2036 64.0511 41.2656 64.0254 41.3185C64.0767 41.3385 64.1354 41.3403 64.1886 41.3148C64.2894 41.2674 64.3334 41.147 64.2839 41.0467C64.2362 40.9465 64.1152 40.9027 64.0144 40.9519Z" fill="#91D7EC" />
                <path id="Vector_986" d="M63.0814 41.6084C63.0337 41.519 62.9292 41.4825 62.8375 41.5154C62.8284 41.519 62.8174 41.519 62.8082 41.5245C62.766 41.5464 62.7385 41.581 62.7202 41.6211C62.766 41.6375 62.8045 41.6685 62.8302 41.7141C62.8614 41.7725 62.8577 41.8363 62.8339 41.891C62.8852 41.9093 62.9439 41.9093 62.997 41.8819C63.0539 41.8527 63.0869 41.798 63.0997 41.7397C63.107 41.6959 63.1052 41.6503 63.0832 41.6084H63.0814Z" fill="#91D7EC" />
                <path id="Vector_987" d="M61.9007 42.212C61.8494 42.1245 61.743 42.0953 61.6514 42.1318C61.6422 42.1354 61.6312 42.1372 61.622 42.1409C61.5817 42.1646 61.556 42.201 61.5396 42.2412C61.5835 42.2558 61.6239 42.2831 61.6514 42.3251C61.6862 42.3816 61.6862 42.4454 61.6642 42.5019C61.7174 42.5183 61.7779 42.5165 61.8292 42.4855C61.886 42.4509 61.9172 42.3943 61.9245 42.3323C61.9282 42.2904 61.9245 42.2485 61.9007 42.2102V42.212Z" fill="#91D7EC" />
                <path id="Vector_988" d="M60.4983 42.8138C60.4891 42.8174 60.4781 42.8193 60.4708 42.8266C60.4341 42.8521 60.4121 42.8886 60.3975 42.9287C60.4415 42.9396 60.4836 42.9633 60.5111 43.0034C60.5515 43.0582 60.5551 43.1256 60.535 43.1858C60.5899 43.2004 60.6504 43.1931 60.7018 43.1585C60.7604 43.1183 60.7861 43.0527 60.7843 42.987C60.7843 42.9487 60.7751 42.9104 60.7513 42.8776C60.6926 42.7956 60.5863 42.7719 60.4965 42.8156L60.4983 42.8138Z" fill="#91D7EC" />
                <path id="Vector_989" d="M59.3965 43.5778C59.3873 43.5833 59.3763 43.5869 59.3671 43.5942C59.3341 43.6216 59.3158 43.6599 59.3066 43.6982C59.3506 43.7055 59.3928 43.7237 59.424 43.7602C59.4698 43.8131 59.4808 43.8805 59.4643 43.9444C59.5211 43.9553 59.5835 43.9444 59.6311 43.9024C59.6879 43.8532 59.7081 43.7802 59.6953 43.711C59.6898 43.6781 59.6769 43.6453 59.6531 43.6179C59.589 43.5414 59.4808 43.5304 59.3965 43.5797V43.5778Z" fill="#91D7EC" />
                <path id="Vector_990" d="M58.3697 44.4422C58.3587 44.4495 58.3459 44.455 58.3367 44.4659C58.3092 44.4951 58.2964 44.5316 58.2891 44.5699C58.3312 44.5735 58.3752 44.5863 58.4101 44.6155C58.4651 44.6629 58.4852 44.734 58.4742 44.8015C58.5329 44.8051 58.5934 44.7869 58.6355 44.7395C58.6905 44.6811 58.7015 44.5972 58.6722 44.5279C58.6612 44.5006 58.6465 44.4751 58.6227 44.455C58.5512 44.3893 58.4467 44.3893 58.3697 44.4441V44.4422Z" fill="#91D7EC" />
                <path id="Vector_991" d="M57.4625 45.4251C57.4478 45.4379 57.4332 45.4488 57.4203 45.467C57.4002 45.498 57.3928 45.5309 57.3892 45.5655C57.4405 45.5619 57.4937 45.5783 57.5377 45.6148C57.5871 45.6567 57.6073 45.7169 57.6037 45.7771C57.6641 45.7734 57.721 45.7442 57.7576 45.6913C57.8053 45.6202 57.7998 45.529 57.754 45.4634C57.7393 45.4433 57.7228 45.4251 57.7026 45.4123C57.6257 45.3613 57.5303 45.3722 57.4625 45.4269V45.4251Z" fill="#91D7EC" />
                <path id="Vector_992" d="M56.9659 46.5101C56.8871 46.4573 56.7863 46.4719 56.7203 46.532C56.7074 46.543 56.6946 46.5521 56.6854 46.5667C56.6231 46.6597 56.6488 46.7837 56.7423 46.8457C56.8358 46.9077 56.9604 46.8822 57.0227 46.7892C57.0796 46.7034 57.0594 46.5904 56.9824 46.5266C56.9769 46.5211 56.9733 46.5138 56.9659 46.5101Z" fill="#91D7EC" />
                <path id="Vector_993" d="M64.9752 40.5088C64.9166 40.5343 64.8781 40.5872 64.8652 40.6455C64.8671 40.6492 64.8707 40.651 64.8726 40.6547C64.8909 40.6966 64.8909 40.7422 64.8817 40.7841C64.9312 40.879 65.0449 40.9209 65.1421 40.8771C65.2447 40.8315 65.2905 40.713 65.2447 40.6109C65.1989 40.5088 65.0797 40.4632 64.9771 40.5088H64.9752Z" fill="#91D7EC" />
                <path id="Vector_994" d="M64.0291 41.1452C64.0071 41.0978 63.9668 41.0668 63.9228 41.0485C63.8715 41.0285 63.8128 41.0267 63.7596 41.0522C63.7028 41.0795 63.668 41.1288 63.6533 41.1853C63.6533 41.1871 63.657 41.189 63.657 41.1908C63.679 41.2345 63.679 41.2838 63.668 41.3276C63.7193 41.4224 63.8348 41.4625 63.9338 41.4151C63.976 41.395 64.0053 41.3585 64.0255 41.3203C64.0511 41.2674 64.0566 41.2035 64.0273 41.147L64.0291 41.1452Z" fill="#91D7EC" />
                <path id="Vector_995" d="M62.83 41.7123C62.8062 41.6668 62.7659 41.6357 62.72 41.6193C62.6669 41.6011 62.6082 41.6011 62.5551 41.6285C62.5037 41.6558 62.4689 41.7032 62.4561 41.7561C62.4817 41.8035 62.4854 41.8546 62.4726 41.902C62.5257 41.9986 62.6467 42.0351 62.7457 41.9822C62.786 41.9603 62.8135 41.9257 62.8319 41.8874C62.8575 41.8327 62.8594 41.767 62.8282 41.7105L62.83 41.7123Z" fill="#91D7EC" />
                <path id="Vector_996" d="M61.6531 42.3269C61.6275 42.2849 61.5872 42.2576 61.5413 42.243C61.4863 42.2247 61.4258 42.2284 61.3745 42.2612C61.3287 42.2886 61.2975 42.3323 61.2847 42.3816C61.3122 42.429 61.3177 42.4819 61.3048 42.5311C61.3048 42.5329 61.3048 42.5366 61.3067 42.5384C61.3653 42.6332 61.49 42.6642 61.5853 42.6059C61.6238 42.5822 61.6495 42.5457 61.666 42.5056C61.688 42.449 61.688 42.3834 61.6531 42.3287V42.3269Z" fill="#91D7EC" />
                <path id="Vector_997" d="M60.5113 43.0034C60.482 42.9633 60.4416 42.9396 60.3976 42.9287C60.3408 42.9141 60.2803 42.9214 60.229 42.9579C60.1886 42.987 60.1648 43.029 60.1538 43.0746C60.1795 43.1202 60.1868 43.1712 60.174 43.2186C60.1776 43.2259 60.1795 43.2332 60.1831 43.2405C60.2491 43.3317 60.3756 43.3517 60.4655 43.2861C60.5003 43.2606 60.5223 43.2241 60.5351 43.1858C60.5553 43.1256 60.5516 43.0581 60.5113 43.0034Z" fill="#91D7EC" />
                <path id="Vector_998" d="M59.4223 43.7602C59.3911 43.7255 59.349 43.7055 59.305 43.6982C59.2463 43.6872 59.184 43.7 59.1363 43.7419C59.1033 43.7711 59.0868 43.8076 59.0776 43.8477C59.1033 43.8933 59.1106 43.9444 59.0996 43.9936C59.107 44.0045 59.1106 44.0173 59.1198 44.0282C59.1931 44.1121 59.3215 44.1194 59.4058 44.0447C59.4369 44.0173 59.4534 43.9808 59.4644 43.9444C59.4809 43.8805 59.4699 43.8131 59.4241 43.7602H59.4223Z" fill="#91D7EC" />
                <path id="Vector_999" d="M58.4082 44.6155C58.3734 44.5845 58.3312 44.5717 58.2872 44.5699C58.2267 44.5662 58.1644 44.5863 58.1222 44.6355C58.1002 44.6611 58.0874 44.6902 58.0801 44.7194C58.1131 44.7668 58.1222 44.8234 58.1094 44.8781C58.1186 44.8926 58.1277 44.9072 58.1406 44.92C58.2249 44.9929 58.3532 44.9838 58.4266 44.8999C58.4522 44.8708 58.4632 44.8361 58.4706 44.8015C58.4816 44.734 58.4632 44.6647 58.4064 44.6155H58.4082Z" fill="#91D7EC" />
                <path id="Vector_1000" d="M57.5377 45.613C57.4955 45.5765 57.4424 45.5601 57.3892 45.5637C57.3379 45.5674 57.2884 45.5911 57.2517 45.633C57.1784 45.7169 57.1875 45.8446 57.2719 45.9175C57.3562 45.9904 57.4845 45.9813 57.5578 45.8974C57.589 45.8628 57.6018 45.819 57.6037 45.7753C57.6073 45.7151 57.5853 45.6549 57.5377 45.613Z" fill="#91D7EC" />
                <path id="Vector_1001" d="M65.8313 40.0383C65.7286 40.0821 65.6791 40.2006 65.7231 40.3027C65.7671 40.4048 65.8863 40.4541 65.9889 40.4103C66.0916 40.3665 66.1411 40.248 66.0971 40.1459C66.0531 40.0438 65.934 39.9945 65.8313 40.0383Z" fill="#91D7EC" />
                <path id="Vector_1002" d="M64.8725 40.6565C64.8725 40.6565 64.867 40.651 64.8651 40.6474C64.8156 40.5544 64.702 40.5106 64.6048 40.5544C64.5021 40.5999 64.4563 40.7185 64.5021 40.8206C64.548 40.9227 64.6671 40.9683 64.7698 40.9227C64.8285 40.8972 64.867 40.8443 64.8798 40.786C64.8908 40.744 64.8908 40.6984 64.8706 40.6565H64.8725Z" fill="#91D7EC" />
                <path id="Vector_1003" d="M63.6572 41.1908C63.6572 41.1908 63.6535 41.1871 63.6535 41.1853C63.6022 41.0905 63.4848 41.0504 63.3877 41.0978C63.2868 41.147 63.2447 41.2674 63.2942 41.3677C63.3437 41.468 63.4647 41.5099 63.5655 41.4607C63.6223 41.4333 63.6572 41.3841 63.6718 41.3276C63.6828 41.2838 63.6828 41.2346 63.6608 41.1908H63.6572Z" fill="#91D7EC" />
                <path id="Vector_1004" d="M62.4581 41.7579C62.405 41.6613 62.2821 41.6248 62.185 41.6777C62.086 41.7306 62.0493 41.8527 62.1025 41.9512C62.1557 42.0497 62.2785 42.0862 62.3775 42.0333C62.4288 42.0059 62.4618 41.9585 62.4765 41.9074C62.4893 41.86 62.4856 41.8071 62.46 41.7616L62.4581 41.7579Z" fill="#91D7EC" />
                <path id="Vector_1005" d="M61.2849 42.3798C61.2849 42.3798 61.2849 42.3743 61.2831 42.3725C61.2244 42.2777 61.0997 42.2485 61.0044 42.3068C60.9091 42.3652 60.8797 42.4892 60.9384 42.584C60.9971 42.6788 61.1217 42.708 61.2171 42.6497C61.2629 42.6223 61.2922 42.5785 61.3051 42.5293C61.3179 42.4801 61.3124 42.4272 61.2849 42.3798Z" fill="#91D7EC" />
                <path id="Vector_1006" d="M60.1536 43.0727C60.1536 43.0727 60.1481 43.0581 60.1426 43.0508C60.0766 42.9615 59.9501 42.9414 59.8602 43.0071C59.7704 43.0727 59.7502 43.1985 59.8162 43.2879C59.8822 43.3773 60.0087 43.3973 60.0986 43.3317C60.1389 43.3025 60.1627 43.2605 60.1737 43.215C60.1847 43.1675 60.1792 43.1165 60.1536 43.0709V43.0727Z" fill="#91D7EC" />
                <path id="Vector_1007" d="M59.0775 43.8477C59.0701 43.8368 59.0665 43.824 59.0573 43.8131C58.9822 43.731 58.8538 43.7237 58.7713 43.7985C58.6888 43.8733 58.6815 44.0009 58.7567 44.083C58.8318 44.165 58.9602 44.1723 59.0426 44.0976C59.0738 44.0684 59.0921 44.0319 59.1013 43.9936C59.1123 43.9444 59.105 43.8933 59.0793 43.8477H59.0775Z" fill="#91D7EC" />
                <path id="Vector_1008" d="M58.0824 44.7212C58.0824 44.7212 58.075 44.7048 58.0695 44.6993C57.9944 44.6173 57.866 44.61 57.7835 44.6847C57.701 44.7595 57.6937 44.8872 57.7689 44.9692C57.844 45.0513 57.9724 45.0586 58.0549 44.9838C58.086 44.9546 58.1044 44.9182 58.1135 44.8799C58.1264 44.8252 58.1172 44.7686 58.0842 44.7212H58.0824Z" fill="#91D7EC" />
                <path id="Vector_1009" d="M66.5849 39.5314C66.4804 39.5733 66.4309 39.69 66.473 39.794C66.5152 39.8979 66.6325 39.9471 66.737 39.9052C66.8415 39.8633 66.891 39.7465 66.8488 39.6426C66.8067 39.5387 66.6894 39.4894 66.5849 39.5314Z" fill="#91D7EC" />
                <path id="Vector_1010" d="M65.3506 40.0237C65.248 40.0656 65.1985 40.1842 65.2406 40.2881C65.2828 40.3921 65.402 40.4395 65.5065 40.3975C65.6091 40.3556 65.6586 40.2371 65.6164 40.1331C65.5743 40.031 65.4551 39.9818 65.3506 40.0237Z" fill="#91D7EC" />
                <path id="Vector_1011" d="M64.1226 40.5343C64.02 40.5799 63.9742 40.6984 64.0181 40.8005C64.064 40.9027 64.1831 40.9482 64.2858 40.9045C64.3885 40.8589 64.4343 40.7404 64.3903 40.6382C64.3445 40.5361 64.2253 40.4905 64.1226 40.5343Z" fill="#91D7EC" />
                <path id="Vector_1012" d="M63.0741 41.4315C63.0997 41.4187 63.1217 41.4023 63.1382 41.3841C63.1914 41.3257 63.206 41.2382 63.1694 41.1634C63.1217 41.0632 63.0007 41.0194 62.8999 41.0686C62.7991 41.116 62.7551 41.2364 62.8046 41.3367C62.8229 41.3732 62.8504 41.3987 62.8834 41.4188C62.9402 41.4534 63.0099 41.4625 63.0741 41.4315Z" fill="#91D7EC" />
                <path id="Vector_1013" d="M61.7172 42.0041C61.7685 42.0242 61.829 42.0224 61.8822 41.995C61.8968 41.9877 61.9078 41.975 61.9188 41.9658C61.9628 41.9275 61.9867 41.8765 61.9885 41.82C61.9885 41.7871 61.9848 41.7543 61.9683 41.7233C61.917 41.6248 61.7942 41.5865 61.6952 41.6394C61.5962 41.6923 61.5577 41.8127 61.6109 41.9111C61.62 41.9294 61.6347 41.944 61.6494 41.9567C61.6695 41.9768 61.6934 41.9932 61.7209 42.0041H61.7172Z" fill="#91D7EC" />
                <path id="Vector_1014" d="M60.6117 42.6296C60.6429 42.6296 60.6722 42.6241 60.7016 42.6096C60.7071 42.6077 60.7126 42.6077 60.7181 42.6041C60.7785 42.5676 60.8097 42.5056 60.8115 42.4418C60.8134 42.4035 60.8079 42.3634 60.7859 42.3269C60.7675 42.2959 60.7382 42.274 60.7089 42.2576C60.6484 42.2248 60.5714 42.2193 60.5072 42.2576C60.4119 42.3141 60.3807 42.4381 60.4376 42.5348C60.4486 42.553 60.4651 42.5676 60.4797 42.5822C60.5164 42.6132 60.5622 42.6296 60.6081 42.6296H60.6117Z" fill="#91D7EC" />
                <path id="Vector_1015" d="M59.5925 43.277C59.642 43.2423 59.6695 43.1894 59.675 43.1329C59.6805 43.0855 59.6695 43.0381 59.6401 42.9961C59.62 42.9688 59.5961 42.9505 59.5686 42.9359C59.5026 42.9013 59.422 42.9031 59.3578 42.9487C59.2735 43.0089 59.2515 43.1219 59.301 43.2095C59.3047 43.2168 59.3047 43.2222 59.3102 43.2295C59.323 43.2478 59.3413 43.2624 59.3578 43.2733C59.4257 43.3225 59.5191 43.328 59.5925 43.2751V43.277Z" fill="#91D7EC" />
                <path id="Vector_1016" d="M58.5112 44.0429C58.5552 44.0119 58.5827 43.9645 58.5918 43.9152C58.601 43.8642 58.5918 43.8076 58.5588 43.762C58.5387 43.7329 58.5112 43.7146 58.48 43.7C58.4158 43.669 58.3388 43.6709 58.2765 43.7146C58.194 43.773 58.172 43.8824 58.2179 43.9699C58.2215 43.979 58.2234 43.9882 58.2289 43.9955C58.2472 44.021 58.2728 44.041 58.2985 44.0538C58.3645 44.0885 58.447 44.0885 58.5112 44.0429Z" fill="#91D7EC" />
                <path id="Vector_1017" d="M67.2445 38.9806C67.14 39.0207 67.0887 39.1374 67.129 39.2414C67.1693 39.3453 67.2866 39.3964 67.3911 39.3563C67.4956 39.3161 67.547 39.1994 67.5066 39.0955C67.4663 38.9915 67.349 38.9405 67.2445 38.9806Z" fill="#91D7EC" />
                <path id="Vector_1018" d="M66.0052 39.4548C65.9007 39.4949 65.8494 39.6116 65.8897 39.7155C65.9301 39.8195 66.0474 39.8706 66.1519 39.8304C66.2564 39.7903 66.3077 39.6736 66.2674 39.5697C66.227 39.4657 66.1097 39.4147 66.0052 39.4548Z" fill="#91D7EC" />
                <path id="Vector_1019" d="M64.768 39.9344C64.6635 39.9763 64.614 40.093 64.6561 40.197C64.6983 40.3009 64.8156 40.3502 64.9201 40.3082C65.0246 40.2663 65.0741 40.1496 65.0319 40.0456C64.9898 39.9417 64.8725 39.8924 64.768 39.9344Z" fill="#91D7EC" />
                <path id="Vector_1020" d="M63.6882 40.8006C63.7908 40.7568 63.8403 40.6383 63.7963 40.5361C63.7523 40.434 63.6332 40.3848 63.5305 40.4286C63.4278 40.4723 63.3784 40.5908 63.4223 40.693C63.4663 40.7951 63.5855 40.8443 63.6882 40.8006Z" fill="#91D7EC" />
                <path id="Vector_1021" d="M62.4691 41.3112C62.5717 41.2656 62.6157 41.1452 62.5699 41.0449C62.524 40.9428 62.4031 40.899 62.3022 40.9446C62.2014 40.9902 62.1556 41.1106 62.2014 41.2109C62.2472 41.3112 62.3682 41.3568 62.4691 41.3112Z" fill="#91D7EC" />
                <path id="Vector_1022" d="M61.0849 41.4899C60.9841 41.5391 60.9438 41.6613 60.9933 41.7598C61.0428 41.8582 61.1656 41.9002 61.2646 41.8509C61.3654 41.8017 61.4058 41.6795 61.3563 41.5811C61.3068 41.4808 61.1839 41.4406 61.0849 41.4899Z" fill="#91D7EC" />
                <path id="Vector_1023" d="M60.086 42.4344C60.1832 42.3797 60.218 42.2575 60.163 42.1591C60.108 42.0624 59.9852 42.0278 59.8862 42.0825C59.7872 42.1372 59.7542 42.2594 59.8092 42.3578C59.8642 42.4563 59.987 42.4891 60.086 42.4344Z" fill="#91D7EC" />
                <path id="Vector_1024" d="M59.006 42.8083C58.9822 42.7682 58.9473 42.7408 58.907 42.7244C58.852 42.7007 58.7879 42.7007 58.731 42.7317C58.6339 42.7864 58.599 42.9086 58.654 43.0071C58.709 43.1037 58.8319 43.1384 58.9308 43.0837C58.9803 43.0563 59.0133 43.0107 59.0262 42.9615C59.039 42.9122 59.0353 42.8575 59.0078 42.8101L59.006 42.8083Z" fill="#91D7EC" />
                <path id="Vector_1025" d="M67.8167 38.3789C67.7123 38.4172 67.6591 38.5339 67.6976 38.6378C67.7361 38.7417 67.8534 38.7946 67.9579 38.7563C68.0624 38.718 68.1156 38.6013 68.0771 38.4974C68.0386 38.3934 67.9212 38.3406 67.8167 38.3789Z" fill="#91D7EC" />
                <path id="Vector_1026" d="M66.713 39.2195C66.8175 39.1812 66.8725 39.0645 66.8322 38.9606C66.7937 38.8566 66.6764 38.8019 66.5719 38.8421C66.4674 38.8804 66.4124 38.9971 66.4527 39.101C66.4912 39.2049 66.6085 39.2597 66.713 39.2195Z" fill="#91D7EC" />
                <path id="Vector_1027" d="M65.4665 39.6772C65.5709 39.6389 65.6259 39.5222 65.5856 39.4183C65.5471 39.3143 65.4298 39.2596 65.3253 39.2998C65.2208 39.3399 65.1658 39.4548 65.2061 39.5587C65.2446 39.6626 65.362 39.7174 65.4665 39.6772Z" fill="#91D7EC" />
                <path id="Vector_1028" d="M64.2235 40.1331C64.328 40.0948 64.3812 39.9781 64.3427 39.8742C64.3042 39.7702 64.1869 39.7173 64.0824 39.7556C63.9779 39.7939 63.9247 39.9106 63.9632 40.0146C64.0017 40.1185 64.119 40.1714 64.2235 40.1331Z" fill="#91D7EC" />
                <path id="Vector_1029" d="M62.9824 40.5963C63.0869 40.5562 63.1383 40.4395 63.0979 40.3355C63.0576 40.2316 62.9403 40.1805 62.8358 40.2206C62.7313 40.2608 62.68 40.3775 62.7203 40.4814C62.7606 40.5854 62.8779 40.6364 62.9824 40.5963Z" fill="#91D7EC" />
                <path id="Vector_1030" d="M61.7469 41.0723C61.8513 41.0303 61.9008 40.9118 61.8568 40.8097C61.8128 40.7075 61.6955 40.6565 61.5929 40.7002C61.4884 40.7422 61.4389 40.8607 61.4829 40.9628C61.5269 41.065 61.6442 41.116 61.7469 41.0723Z" fill="#91D7EC" />
                <path id="Vector_1031" d="M60.5222 41.5701C60.6249 41.5245 60.6707 41.406 60.6249 41.3039C60.5791 41.2018 60.4599 41.1562 60.3573 41.2018C60.2546 41.2474 60.2088 41.3659 60.2546 41.468C60.3004 41.5701 60.4196 41.6157 60.5222 41.5701Z" fill="#91D7EC" />
                <path id="Vector_1032" d="M59.1434 41.7342C59.0407 41.7798 58.9949 41.8984 59.0407 42.0005C59.0866 42.1026 59.2057 42.1482 59.3084 42.1026C59.411 42.057 59.4569 41.9385 59.411 41.8364C59.3652 41.7342 59.246 41.6886 59.1434 41.7342Z" fill="#91D7EC" />
                <path id="Vector_1033" d="M68.3042 37.7278C68.1997 37.7661 68.1447 37.8828 68.1832 37.9868C68.2217 38.0907 68.339 38.1454 68.4435 38.1071C68.548 38.0688 68.603 37.9521 68.5645 37.8482C68.526 37.7442 68.4087 37.6895 68.3042 37.7278Z" fill="#91D7EC" />
                <path id="Vector_1034" d="M67.1951 38.5612C67.3015 38.5248 67.3564 38.4099 67.3198 38.3041C67.2831 38.1983 67.1676 38.1436 67.0613 38.1801C66.955 38.2166 66.9 38.3315 66.9366 38.4372C66.9733 38.543 67.0888 38.5977 67.1951 38.5612Z" fill="#91D7EC" />
                <path id="Vector_1035" d="M65.9411 39.0007C66.0475 38.9642 66.1043 38.8493 66.0676 38.7454C66.031 38.6396 65.9155 38.5831 65.811 38.6195C65.7046 38.656 65.6478 38.7709 65.6845 38.8748C65.7211 38.9806 65.8366 39.0371 65.9411 39.0007Z" fill="#91D7EC" />
                <path id="Vector_1036" d="M64.6834 39.4292C64.7897 39.3946 64.8466 39.2797 64.8117 39.1739C64.7769 39.0681 64.6614 39.0116 64.5551 39.0463C64.4487 39.0809 64.3919 39.1958 64.4267 39.3016C64.4616 39.4073 64.5771 39.4639 64.6834 39.4292Z" fill="#91D7EC" />
                <path id="Vector_1037" d="M63.4241 39.8486C63.5304 39.814 63.5873 39.6991 63.5524 39.5933C63.5176 39.4876 63.4021 39.431 63.2958 39.4657C63.1895 39.5003 63.1326 39.6152 63.1675 39.721C63.2023 39.8268 63.3178 39.8833 63.4241 39.8486Z" fill="#91D7EC" />
                <path id="Vector_1038" d="M62.1648 40.2662C62.2712 40.2316 62.328 40.1167 62.2932 40.0109C62.2583 39.9052 62.1428 39.8486 62.0365 39.8833C61.9302 39.9179 61.8734 40.0328 61.9082 40.1386C61.943 40.2444 62.0585 40.3009 62.1648 40.2662Z" fill="#91D7EC" />
                <path id="Vector_1039" d="M61.032 40.4267C60.9953 40.3209 60.8817 40.2644 60.7753 40.3009C60.669 40.3373 60.6122 40.4504 60.6488 40.5562C60.6855 40.6619 60.7992 40.7185 60.9055 40.682C61.0118 40.6455 61.0686 40.5325 61.032 40.4267Z" fill="#91D7EC" />
                <path id="Vector_1040" d="M59.6477 41.1069C59.754 41.0705 59.8108 40.9574 59.7742 40.8516C59.7375 40.7459 59.6238 40.6893 59.5175 40.7258C59.4112 40.7623 59.3544 40.8753 59.391 40.9811C59.4277 41.0869 59.5413 41.1434 59.6477 41.1069Z" fill="#91D7EC" />
                <path id="Vector_1041" d="M68.7148 37.0185C68.6103 37.0568 68.5553 37.1716 68.5938 37.2774C68.6323 37.3814 68.7478 37.4361 68.8542 37.3978C68.9587 37.3595 69.0137 37.2446 68.9752 37.1388C68.9367 37.0349 68.8212 36.9802 68.7148 37.0185Z" fill="#91D7EC" />
                <path id="Vector_1042" d="M67.7302 37.5965C67.6936 37.4907 67.5781 37.4342 67.4736 37.4707C67.3672 37.5071 67.3104 37.622 67.3471 37.726C67.3837 37.8299 67.4992 37.8883 67.6037 37.8518C67.7101 37.8153 67.7669 37.7004 67.7302 37.5965Z" fill="#91D7EC" />
                <path id="Vector_1043" d="M66.4746 38.0269C66.4398 37.9211 66.3261 37.8628 66.2198 37.8956C66.1135 37.9284 66.0548 38.0433 66.0878 38.1491C66.1208 38.2549 66.2363 38.3132 66.3426 38.2804C66.4489 38.2457 66.5076 38.1327 66.4746 38.0269Z" fill="#91D7EC" />
                <path id="Vector_1044" d="M65.2116 38.4335C65.1786 38.3278 65.0668 38.2658 64.9586 38.2986C64.8505 38.3314 64.79 38.4427 64.823 38.5503C64.856 38.656 64.9678 38.718 65.076 38.6852C65.1841 38.6524 65.2446 38.5411 65.2116 38.4335Z" fill="#91D7EC" />
                <path id="Vector_1045" d="M63.941 38.8165C63.9098 38.7089 63.798 38.6469 63.6898 38.6779C63.5817 38.7089 63.5193 38.8201 63.5505 38.9277C63.5817 39.0353 63.6935 39.0973 63.8017 39.0663C63.9098 39.0353 63.9722 38.9241 63.941 38.8165Z" fill="#91D7EC" />
                <path id="Vector_1046" d="M62.6632 39.1812C62.6339 39.0736 62.5239 39.0098 62.4157 39.039C62.3076 39.0682 62.2434 39.1776 62.2727 39.2852C62.3021 39.3928 62.4121 39.4566 62.5202 39.4274C62.6284 39.3982 62.6925 39.2888 62.6632 39.1812Z" fill="#91D7EC" />
                <path id="Vector_1047" d="M61.3819 39.5259C61.3544 39.4183 61.2445 39.3526 61.1363 39.38C61.0281 39.4073 60.9621 39.5168 60.9896 39.6243C61.0171 39.7319 61.1271 39.7976 61.2353 39.7702C61.3435 39.7429 61.4094 39.6335 61.3819 39.5259Z" fill="#91D7EC" />
                <path id="Vector_1048" d="M59.9467 40.0948C60.0549 40.0675 60.1209 39.958 60.0934 39.8505C60.0659 39.7429 59.9559 39.6772 59.8477 39.7046C59.7396 39.7319 59.6736 39.8413 59.7011 39.9489C59.7286 40.0565 59.8386 40.1222 59.9467 40.0948Z" fill="#91D7EC" />
                <path id="Vector_1049" d="M69.0538 36.2544C68.9493 36.2927 68.8943 36.4094 68.9347 36.5134C68.975 36.6173 69.0905 36.672 69.195 36.6319C69.2995 36.5936 69.3545 36.4769 69.3141 36.3729C69.2738 36.269 69.1583 36.2143 69.0538 36.2544Z" fill="#91D7EC" />
                <path id="Vector_1050" d="M67.9446 37.0914C68.0509 37.0568 68.1078 36.9419 68.0729 36.8361C68.0381 36.7304 67.9226 36.6738 67.8163 36.7085C67.71 36.7431 67.6531 36.858 67.688 36.9638C67.7228 37.0696 67.8383 37.1261 67.9446 37.0914Z" fill="#91D7EC" />
                <path id="Vector_1051" d="M66.6801 37.5127C66.7864 37.4798 66.8469 37.3686 66.8158 37.261C66.7828 37.1552 66.671 37.0951 66.5628 37.1261C66.4565 37.1589 66.396 37.2701 66.4271 37.3777C66.4601 37.4835 66.572 37.5437 66.6801 37.5127Z" fill="#91D7EC" />
                <path id="Vector_1052" d="M65.296 37.5108C65.1879 37.54 65.1237 37.6512 65.1549 37.7588C65.1842 37.8664 65.296 37.9303 65.4042 37.8993C65.5123 37.8701 65.5765 37.7588 65.5453 37.6512C65.516 37.5437 65.4042 37.4798 65.296 37.5108Z" fill="#91D7EC" />
                <path id="Vector_1053" d="M64.117 38.2494C64.2252 38.2238 64.293 38.1144 64.2655 38.005C64.2398 37.8974 64.1298 37.8299 64.0199 37.8573C63.9117 37.8828 63.8439 37.9922 63.8714 38.1016C63.897 38.2092 64.007 38.2767 64.117 38.2494Z" fill="#91D7EC" />
                <path id="Vector_1054" d="M62.821 38.5649C62.931 38.5412 63.0007 38.4354 62.9768 38.326C62.953 38.2166 62.8467 38.1473 62.7367 38.171C62.6267 38.1947 62.557 38.3004 62.5808 38.4099C62.6047 38.5193 62.711 38.5886 62.821 38.5649Z" fill="#91D7EC" />
                <path id="Vector_1055" d="M61.6788 38.6068C61.6587 38.4974 61.5542 38.4244 61.4442 38.4427C61.3342 38.4609 61.2608 38.5667 61.2792 38.6761C61.2975 38.7855 61.4038 38.8584 61.5138 38.8402C61.6238 38.822 61.6972 38.7162 61.6788 38.6068Z" fill="#91D7EC" />
                <path id="Vector_1056" d="M60.3717 38.8348C60.3515 38.7253 60.247 38.6524 60.137 38.6706C60.027 38.6907 59.9537 38.7946 59.972 38.9041C59.9922 39.0135 60.0967 39.0864 60.2067 39.0682C60.3167 39.0481 60.39 38.9442 60.3717 38.8348Z" fill="#91D7EC" />
                <path id="Vector_1057" d="M69.3252 35.4338C69.2207 35.4739 69.1675 35.5888 69.2078 35.6946C69.2482 35.7985 69.3637 35.8514 69.47 35.8113C69.5745 35.7711 69.6277 35.6563 69.5873 35.5505C69.547 35.4465 69.4315 35.3937 69.3252 35.4338Z" fill="#91D7EC" />
                <path id="Vector_1058" d="M68.3483 36.0283C68.3135 35.9225 68.198 35.866 68.0917 35.9006C67.9854 35.9353 67.9285 36.0502 67.9634 36.1559C67.9982 36.2617 68.1137 36.3182 68.22 36.2836C68.3263 36.2489 68.3832 36.134 68.3483 36.0283Z" fill="#91D7EC" />
                <path id="Vector_1059" d="M67.0926 36.4531C67.0615 36.3455 66.9478 36.2854 66.8415 36.3164C66.7333 36.3474 66.6728 36.4604 66.704 36.5662C66.7351 36.6738 66.8488 36.734 66.9551 36.703C67.0633 36.672 67.1238 36.5589 67.0926 36.4531Z" fill="#91D7EC" />
                <path id="Vector_1060" d="M65.8185 36.8325C65.791 36.7249 65.681 36.6592 65.5728 36.6866C65.4647 36.7139 65.3987 36.8233 65.4262 36.9309C65.4537 37.0385 65.5637 37.1042 65.6718 37.0768C65.78 37.0495 65.846 36.94 65.8185 36.8325Z" fill="#91D7EC" />
                <path id="Vector_1061" d="M64.5332 37.1625C64.5112 37.0531 64.403 36.9838 64.2931 37.0057C64.1831 37.0276 64.1134 37.1352 64.1354 37.2446C64.1574 37.354 64.2656 37.4233 64.3756 37.4014C64.4855 37.3795 64.5552 37.2719 64.5332 37.1625Z" fill="#91D7EC" />
                <path id="Vector_1062" d="M63.2354 37.4397C63.2171 37.3303 63.1126 37.2555 63.0026 37.2737C62.8926 37.292 62.8174 37.3959 62.8358 37.5053C62.8541 37.6147 62.9586 37.6895 63.0686 37.6713C63.1786 37.653 63.2537 37.5491 63.2354 37.4397Z" fill="#91D7EC" />
                <path id="Vector_1063" d="M61.9244 37.6622C61.9115 37.551 61.8125 37.4726 61.7007 37.4835C61.5889 37.4963 61.51 37.5947 61.521 37.706C61.5339 37.8172 61.6329 37.8956 61.7447 37.8847C61.8565 37.8719 61.9354 37.7734 61.9244 37.6622Z" fill="#91D7EC" />
                <path id="Vector_1064" d="M60.4268 38.0324C60.5387 38.0196 60.6175 37.9212 60.6065 37.8099C60.5955 37.6987 60.4947 37.6203 60.3828 37.6312C60.271 37.644 60.1922 37.7424 60.2032 37.8537C60.216 37.9649 60.315 38.0433 60.4268 38.0324Z" fill="#91D7EC" />
                <path id="Vector_1065" d="M69.5342 34.5621C69.4297 34.6022 69.3784 34.7208 69.4205 34.8229C69.4609 34.9268 69.58 34.9779 69.6827 34.9359C69.7872 34.8958 69.8385 34.7773 69.7963 34.6752C69.756 34.5712 69.6368 34.5202 69.5342 34.5621Z" fill="#91D7EC" />
                <path id="Vector_1066" d="M68.4382 35.4265C68.5445 35.39 68.6014 35.277 68.5647 35.1712C68.528 35.0654 68.4144 35.0089 68.308 35.0454C68.2017 35.0819 68.1449 35.1949 68.1816 35.3007C68.2182 35.4065 68.3319 35.463 68.4382 35.4265Z" fill="#91D7EC" />
                <path id="Vector_1067" d="M67.1713 35.8514C67.2794 35.8204 67.3418 35.7091 67.3106 35.6015C67.2795 35.4939 67.1676 35.4319 67.0595 35.4629C66.9513 35.4939 66.889 35.6052 66.9201 35.7128C66.9513 35.8204 67.0631 35.8824 67.1713 35.8514Z" fill="#91D7EC" />
                <path id="Vector_1068" d="M65.8843 36.2179C65.9925 36.1924 66.0603 36.0848 66.0365 35.9754C66.0108 35.8678 65.9027 35.8003 65.7927 35.824C65.6845 35.8495 65.6167 35.9571 65.6405 36.0666C65.6662 36.1741 65.7743 36.2416 65.8843 36.2179Z" fill="#91D7EC" />
                <path id="Vector_1069" d="M64.7439 36.2854C64.7238 36.176 64.6193 36.103 64.5093 36.1231C64.3993 36.1431 64.3259 36.2471 64.3461 36.3565C64.3663 36.4659 64.4708 36.5388 64.5808 36.5188C64.6908 36.4987 64.7641 36.3948 64.7439 36.2854Z" fill="#91D7EC" />
                <path id="Vector_1070" d="M63.2629 36.754C63.3747 36.7412 63.4535 36.641 63.4389 36.5297C63.426 36.4185 63.3252 36.3401 63.2134 36.3547C63.1016 36.3674 63.0227 36.4677 63.0374 36.579C63.0502 36.6902 63.1511 36.7686 63.2629 36.754Z" fill="#91D7EC" />
                <path id="Vector_1071" d="M61.9299 36.9163C62.0417 36.9109 62.1279 36.816 62.1205 36.7048C62.115 36.5936 62.0197 36.5078 61.9079 36.5151C61.7961 36.5224 61.7099 36.6154 61.7172 36.7267C61.7227 36.8379 61.8181 36.9236 61.9299 36.9163Z" fill="#91D7EC" />
                <path id="Vector_1072" d="M60.7973 36.7741C60.7918 36.6629 60.6965 36.5772 60.5846 36.5845C60.4728 36.5899 60.3867 36.6848 60.394 36.796C60.3995 36.9073 60.4948 36.993 60.6066 36.9857C60.7185 36.9802 60.8046 36.8854 60.7973 36.7741Z" fill="#91D7EC" />
                <path id="Vector_1073" d="M69.6809 33.6394C69.5782 33.6831 69.5287 33.7998 69.5727 33.9038C69.6167 34.0077 69.7341 34.0551 69.8386 34.0114C69.9412 33.9676 69.9907 33.8509 69.9467 33.747C69.9027 33.6448 69.7854 33.5956 69.6809 33.6394Z" fill="#91D7EC" />
                <path id="Vector_1074" d="M68.726 34.2667C68.6894 34.1609 68.5739 34.1062 68.4676 34.1427C68.3612 34.1792 68.3062 34.2941 68.3429 34.3998C68.3796 34.5056 68.495 34.5603 68.6014 34.5238C68.7077 34.4874 68.7627 34.3725 68.726 34.2667Z" fill="#91D7EC" />
                <path id="Vector_1075" d="M67.4737 34.7135C67.4425 34.6059 67.3307 34.5439 67.2225 34.5749C67.1144 34.6059 67.0521 34.7171 67.0832 34.8247C67.1144 34.9323 67.2262 34.9943 67.3344 34.9633C67.4425 34.9323 67.5049 34.8211 67.4737 34.7135Z" fill="#91D7EC" />
                <path id="Vector_1076" d="M66.1996 35.0836C66.1757 34.9742 66.0676 34.9068 65.9576 34.9305C65.8476 34.9542 65.7798 35.0618 65.8036 35.1712C65.8274 35.2806 65.9356 35.3481 66.0456 35.3243C66.1556 35.3006 66.2234 35.1931 66.1996 35.0836Z" fill="#91D7EC" />
                <path id="Vector_1077" d="M64.9053 35.3809C64.8888 35.2715 64.7843 35.1949 64.6743 35.2131C64.5643 35.2295 64.4873 35.3335 64.5056 35.4429C64.524 35.5523 64.6266 35.6289 64.7366 35.6107C64.8466 35.5943 64.9236 35.4903 64.9053 35.3809Z" fill="#91D7EC" />
                <path id="Vector_1078" d="M63.5944 35.5979C63.5853 35.4867 63.4863 35.4046 63.3763 35.4137C63.2645 35.4228 63.182 35.5213 63.1911 35.6307C63.2003 35.7401 63.2993 35.824 63.4093 35.8149C63.5211 35.8058 63.6036 35.7073 63.5944 35.5979Z" fill="#91D7EC" />
                <path id="Vector_1079" d="M62.2709 35.7237C62.2709 35.6125 62.1792 35.5231 62.0674 35.5231C61.9556 35.5231 61.8657 35.6143 61.8657 35.7255C61.8657 35.8368 61.9574 35.9261 62.0692 35.9261C62.181 35.9261 62.2709 35.835 62.2709 35.7237Z" fill="#91D7EC" />
                <path id="Vector_1080" d="M60.9437 35.7311C60.9437 35.6198 60.8521 35.5305 60.7402 35.5305C60.6284 35.5305 60.5386 35.6216 60.5386 35.7329C60.5386 35.8441 60.6302 35.9335 60.7421 35.9335C60.8539 35.9335 60.9437 35.8423 60.9437 35.7311Z" fill="#91D7EC" />
                <path id="Vector_1081" d="M69.7689 32.6711C69.6662 32.7167 69.6204 32.8352 69.6662 32.9373C69.712 33.0394 69.8312 33.085 69.9339 33.0394C70.0365 32.9938 70.0824 32.8753 70.0365 32.7732C69.9907 32.6711 69.8715 32.6255 69.7689 32.6711Z" fill="#91D7EC" />
                <path id="Vector_1082" d="M68.8303 33.3257C68.7918 33.2218 68.6764 33.1671 68.57 33.2054C68.4637 33.2436 68.4105 33.3585 68.449 33.4643C68.4875 33.5682 68.603 33.623 68.7093 33.5847C68.8157 33.5464 68.8688 33.4315 68.8303 33.3257Z" fill="#91D7EC" />
                <path id="Vector_1083" d="M67.5855 33.7871C67.5544 33.6795 67.4425 33.6175 67.3344 33.6485C67.2262 33.6795 67.1639 33.7907 67.195 33.8983C67.2262 34.0059 67.338 34.0679 67.4462 34.0369C67.5544 34.0059 67.6167 33.8947 67.5855 33.7871Z" fill="#91D7EC" />
                <path id="Vector_1084" d="M66.3113 34.1646C66.2875 34.0552 66.1811 33.9859 66.0711 34.0096C65.9611 34.0333 65.8915 34.1391 65.9153 34.2485C65.9391 34.3579 66.0455 34.4272 66.1555 34.4035C66.2655 34.3798 66.3351 34.274 66.3113 34.1646Z" fill="#91D7EC" />
                <path id="Vector_1085" d="M64.8429 34.6806C64.9547 34.666 65.0317 34.5639 65.017 34.4545C65.0024 34.3433 64.8997 34.2667 64.7897 34.2813C64.6779 34.2958 64.6009 34.398 64.6156 34.5074C64.6302 34.6186 64.7329 34.6952 64.8429 34.6806Z" fill="#91D7EC" />
                <path id="Vector_1086" d="M63.7028 34.646C63.6973 34.5348 63.6019 34.4491 63.4901 34.4545C63.3783 34.46 63.2921 34.5548 63.2976 34.6661C63.3031 34.7773 63.3984 34.863 63.5103 34.8575C63.6221 34.8521 63.7083 34.7572 63.7028 34.646Z" fill="#91D7EC" />
                <path id="Vector_1087" d="M62.3755 34.7353C62.3791 34.6241 62.293 34.5311 62.1811 34.5256C62.0693 34.522 61.9758 34.6077 61.9703 34.7189C61.9667 34.8302 62.0528 34.9232 62.1646 34.9286C62.2765 34.9341 62.37 34.8466 62.3755 34.7353Z" fill="#91D7EC" />
                <path id="Vector_1088" d="M61.0503 34.6825C61.0539 34.5713 60.9678 34.4782 60.856 34.4728C60.7441 34.4673 60.6506 34.5548 60.6451 34.6661C60.6415 34.7773 60.7276 34.8703 60.8395 34.8758C60.9513 34.8794 61.0448 34.7937 61.0503 34.6825Z" fill="#91D7EC" />
                <path id="Vector_1089" d="M69.8039 31.6681C69.7031 31.7155 69.6609 31.8359 69.7086 31.9362C69.7562 32.0365 69.8772 32.0784 69.978 32.031C70.0789 31.9836 70.121 31.8632 70.0734 31.7629C70.0257 31.6626 69.9047 31.6207 69.8039 31.6681Z" fill="#91D7EC" />
                <path id="Vector_1090" d="M68.8837 32.3501C68.8434 32.2462 68.7261 32.1933 68.6216 32.2334C68.5171 32.2735 68.4639 32.3902 68.5042 32.4942C68.5446 32.5981 68.6619 32.651 68.7664 32.6109C68.8709 32.5708 68.924 32.4541 68.8837 32.3501Z" fill="#91D7EC" />
                <path id="Vector_1091" d="M67.6477 32.8352C67.6165 32.7276 67.5028 32.6674 67.3965 32.6984C67.2902 32.7294 67.2278 32.8425 67.259 32.9483C67.2902 33.0559 67.4038 33.116 67.5102 33.085C67.6165 33.054 67.6788 32.941 67.6477 32.8352Z" fill="#91D7EC" />
                <path id="Vector_1092" d="M66.3774 33.2218C66.3554 33.1124 66.2473 33.0431 66.1373 33.0649C66.0273 33.0868 65.9576 33.1944 65.9796 33.3038C66.0016 33.4132 66.1098 33.4825 66.2198 33.4607C66.3298 33.4388 66.3994 33.3312 66.3774 33.2218Z" fill="#91D7EC" />
                <path id="Vector_1093" d="M65.0775 33.5063C65.0647 33.395 64.9639 33.3166 64.852 33.3294C64.7402 33.3421 64.6614 33.4424 64.6742 33.5537C64.6871 33.6649 64.7879 33.7433 64.8997 33.7305C65.0115 33.7178 65.0904 33.6175 65.0775 33.5063Z" fill="#91D7EC" />
                <path id="Vector_1094" d="M63.7616 33.6795C63.7579 33.5683 63.6663 33.4807 63.5545 33.4826C63.4426 33.4844 63.3546 33.5774 63.3565 33.6886C63.3601 33.7999 63.4518 33.8874 63.5636 33.8856C63.6755 33.8819 63.7634 33.7908 63.7616 33.6795Z" fill="#91D7EC" />
                <path id="Vector_1095" d="M62.2472 33.5154C62.1353 33.5063 62.0382 33.5883 62.029 33.6996C62.0198 33.8108 62.1023 33.9075 62.2142 33.9166C62.326 33.9257 62.4232 33.8436 62.4323 33.7324C62.4415 33.6212 62.359 33.5245 62.2472 33.5154Z" fill="#91D7EC" />
                <path id="Vector_1096" d="M60.7072 33.5938C60.6981 33.705 60.7806 33.8017 60.8924 33.8108C61.0042 33.8199 61.1014 33.7379 61.1106 33.6266C61.1197 33.5154 61.0372 33.4187 60.9254 33.4096C60.8136 33.4005 60.7164 33.4826 60.7072 33.5938Z" fill="#91D7EC" />
                <path id="Vector_1097" d="M69.7857 30.6396C69.6867 30.6907 69.6482 30.8129 69.6995 30.9113C69.7508 31.0098 69.8736 31.0481 69.9726 30.997C70.0716 30.946 70.1101 30.8238 70.0588 30.7253C70.0075 30.6269 69.8846 30.5886 69.7857 30.6396Z" fill="#91D7EC" />
                <path id="Vector_1098" d="M68.8869 31.3508C68.8448 31.2469 68.7274 31.1976 68.6229 31.2396C68.5185 31.2815 68.469 31.3982 68.5111 31.5022C68.5533 31.6061 68.6706 31.6553 68.7751 31.6134C68.8796 31.5714 68.9291 31.4547 68.8869 31.3508Z" fill="#91D7EC" />
                <path id="Vector_1099" d="M67.6607 31.8614C67.6277 31.7556 67.5159 31.6936 67.4077 31.7265C67.3014 31.7593 67.239 31.8705 67.272 31.9781C67.305 32.0839 67.4169 32.1459 67.525 32.1131C67.6313 32.0802 67.6937 31.969 67.6607 31.8614Z" fill="#91D7EC" />
                <path id="Vector_1100" d="M66.3942 32.2608C66.3722 32.1514 66.264 32.0821 66.1558 32.1039C66.0459 32.1258 65.9762 32.2334 65.9982 32.341C66.0202 32.4504 66.1284 32.5197 66.2365 32.4978C66.3447 32.476 66.4162 32.3684 66.3942 32.2608Z" fill="#91D7EC" />
                <path id="Vector_1101" d="M64.8724 32.3629C64.7606 32.3738 64.6799 32.4741 64.6927 32.5836C64.7037 32.6948 64.8046 32.775 64.9146 32.7623C65.0264 32.7513 65.1071 32.651 65.0942 32.5416C65.0832 32.4304 64.9824 32.3501 64.8724 32.3629Z" fill="#91D7EC" />
                <path id="Vector_1102" d="M63.5746 32.4997C63.4628 32.4997 63.3711 32.589 63.3711 32.7003C63.3711 32.8115 63.4609 32.9027 63.5727 32.9027C63.6846 32.9027 63.7762 32.8133 63.7762 32.7003C63.7762 32.589 63.6864 32.4979 63.5727 32.4979L63.5746 32.4997Z" fill="#91D7EC" />
                <path id="Vector_1103" d="M62.2693 32.4997C62.1575 32.4869 62.0567 32.5653 62.0438 32.6765C62.031 32.7878 62.1098 32.8881 62.2217 32.9008C62.3335 32.9136 62.4343 32.8352 62.4472 32.724C62.46 32.6127 62.3812 32.5124 62.2693 32.4997Z" fill="#91D7EC" />
                <path id="Vector_1104" d="M60.951 32.3465C60.8392 32.3337 60.7383 32.4121 60.7255 32.5233C60.7127 32.6346 60.7915 32.7349 60.9033 32.7476C61.0151 32.7604 61.116 32.682 61.1288 32.5708C61.1416 32.4595 61.0628 32.3592 60.951 32.3465Z" fill="#91D7EC" />
                <path id="Vector_1105" d="M69.7139 29.5947C69.6168 29.6494 69.5819 29.7716 69.6369 29.8682C69.6919 29.9649 69.8148 29.9995 69.9119 29.9448C70.0091 29.8901 70.0439 29.7679 69.9889 29.6713C69.9339 29.5746 69.8111 29.54 69.7139 29.5947Z" fill="#91D7EC" />
                <path id="Vector_1106" d="M68.5754 30.2311C68.4727 30.2749 68.425 30.3934 68.469 30.4956C68.513 30.5977 68.6322 30.6451 68.7348 30.6013C68.8375 30.5576 68.8852 30.439 68.8412 30.3369C68.7972 30.2348 68.678 30.1874 68.5754 30.2311Z" fill="#91D7EC" />
                <path id="Vector_1107" d="M67.3748 30.7454C67.2684 30.7782 67.208 30.8912 67.241 30.997C67.2739 31.1028 67.3876 31.163 67.4939 31.1301C67.6003 31.0973 67.6608 30.9842 67.6278 30.8785C67.5948 30.7727 67.4811 30.7125 67.3748 30.7454Z" fill="#91D7EC" />
                <path id="Vector_1108" d="M65.9685 31.3709C65.9905 31.4803 66.0968 31.5514 66.2068 31.5277C66.3168 31.5058 66.3883 31.4001 66.3644 31.2907C66.3424 31.1812 66.2361 31.1101 66.1261 31.1338C66.0161 31.1575 65.9446 31.2615 65.9685 31.3709Z" fill="#91D7EC" />
                <path id="Vector_1109" d="M64.6636 31.6098C64.6746 31.721 64.7717 31.8031 64.8836 31.7921C64.9954 31.7812 65.0779 31.6845 65.0669 31.5733C65.0559 31.4621 64.9587 31.38 64.8469 31.3909C64.7351 31.4019 64.6526 31.4985 64.6636 31.6098Z" fill="#91D7EC" />
                <path id="Vector_1110" d="M63.3399 31.7082C63.338 31.8194 63.426 31.9124 63.5379 31.9143C63.6497 31.9161 63.7432 31.8286 63.745 31.7173C63.7468 31.6061 63.6589 31.5131 63.547 31.5113C63.4352 31.5094 63.3417 31.597 63.3399 31.7082Z" fill="#91D7EC" />
                <path id="Vector_1111" d="M62.0145 31.6517C61.998 31.7611 62.0731 31.8651 62.185 31.8815C62.295 31.8979 62.3995 31.8231 62.416 31.7119C62.4325 31.6025 62.3573 31.4985 62.2455 31.4821C62.1355 31.4657 62.031 31.5405 62.0145 31.6517Z" fill="#91D7EC" />
                <path id="Vector_1112" d="M60.8725 31.6827C60.9825 31.6991 61.087 31.6243 61.1035 31.5131C61.12 31.4037 61.0448 31.2997 60.933 31.2833C60.823 31.2669 60.7185 31.3417 60.702 31.4529C60.6855 31.5623 60.7606 31.6663 60.8725 31.6827Z" fill="#91D7EC" />
                <path id="Vector_1113" d="M69.5985 28.548C69.5032 28.6064 69.472 28.7304 69.5289 28.8252C69.5875 28.92 69.7122 28.951 69.8075 28.8945C69.9029 28.8361 69.934 28.7121 69.8772 28.6173C69.8185 28.5225 69.6939 28.4915 69.5985 28.548Z" fill="#91D7EC" />
                <path id="Vector_1114" d="M68.4822 29.2209C68.3795 29.2665 68.3355 29.3868 68.3814 29.4871C68.4272 29.5892 68.5482 29.633 68.649 29.5874C68.7517 29.5418 68.7957 29.4215 68.7498 29.3212C68.704 29.2191 68.583 29.1753 68.4822 29.2209Z" fill="#91D7EC" />
                <path id="Vector_1115" d="M67.2921 29.7588C67.1857 29.7935 67.1271 29.9065 67.1619 30.0123C67.1967 30.1181 67.3104 30.1764 67.4167 30.1418C67.5231 30.1071 67.5817 29.9941 67.5469 29.8883C67.5121 29.7825 67.3984 29.7242 67.2921 29.7588Z" fill="#91D7EC" />
                <path id="Vector_1116" d="M66.0531 30.16C65.9431 30.1819 65.8716 30.2877 65.8936 30.3971C65.9156 30.5065 66.0219 30.5776 66.1319 30.5557C66.2419 30.5339 66.3134 30.4281 66.2914 30.3187C66.2694 30.2093 66.1631 30.1381 66.0531 30.16Z" fill="#91D7EC" />
                <path id="Vector_1117" d="M64.8063 30.8183C64.9181 30.8092 65.0006 30.7126 64.9914 30.6013C64.9822 30.4901 64.8851 30.408 64.7732 30.4171C64.6614 30.4263 64.5789 30.5229 64.5881 30.6341C64.5973 30.7454 64.6944 30.8274 64.8063 30.8183Z" fill="#91D7EC" />
                <path id="Vector_1118" d="M63.4756 30.5211C63.3638 30.5156 63.2684 30.6013 63.2629 30.7125C63.2574 30.8238 63.3436 30.9186 63.4554 30.9241C63.5673 30.9295 63.6626 30.8438 63.6681 30.7326C63.6736 30.6214 63.5874 30.5265 63.4756 30.5211Z" fill="#91D7EC" />
                <path id="Vector_1119" d="M62.1773 30.4627C62.0673 30.4427 61.961 30.5156 61.9408 30.625C61.9207 30.7344 61.994 30.8402 62.104 30.8603C62.214 30.8803 62.3203 30.8074 62.3405 30.698C62.3606 30.5886 62.2873 30.4828 62.1773 30.4627Z" fill="#91D7EC" />
                <path id="Vector_1120" d="M60.7988 30.6195C60.9088 30.6396 61.0151 30.5667 61.0353 30.4573C61.0555 30.3478 60.9821 30.2421 60.8721 30.222C60.7621 30.2019 60.6558 30.2749 60.6357 30.3843C60.6155 30.4937 60.6888 30.5995 60.7988 30.6195Z" fill="#91D7EC" />
                <path id="Vector_1121" d="M69.4354 27.5159C69.3419 27.576 69.3144 27.7019 69.3749 27.7949C69.4354 27.8879 69.5619 27.9152 69.6554 27.8551C69.7489 27.7949 69.7764 27.669 69.7159 27.576C69.6554 27.483 69.5289 27.4557 69.4354 27.5159Z" fill="#91D7EC" />
                <path id="Vector_1122" d="M68.3425 28.2197C68.2416 28.2672 68.1995 28.3875 68.2471 28.4878C68.2948 28.5881 68.4158 28.6301 68.5166 28.5826C68.6174 28.5352 68.6596 28.4149 68.6119 28.3146C68.5643 28.2143 68.4433 28.1723 68.3425 28.2197Z" fill="#91D7EC" />
                <path id="Vector_1123" d="M67.1693 28.7814C67.063 28.8161 67.0062 28.931 67.041 29.0367C67.0758 29.1425 67.1913 29.199 67.2976 29.1644C67.404 29.1297 67.4608 29.0148 67.426 28.9091C67.3911 28.8033 67.2756 28.7468 67.1693 28.7814Z" fill="#91D7EC" />
                <path id="Vector_1124" d="M65.934 29.1917C65.824 29.2136 65.7525 29.3194 65.7745 29.4288C65.7965 29.5382 65.9028 29.6093 66.0128 29.5874C66.1228 29.5655 66.1943 29.4598 66.1723 29.3503C66.1503 29.2409 66.044 29.1698 65.934 29.1917Z" fill="#91D7EC" />
                <path id="Vector_1125" d="M64.6855 29.85C64.7973 29.8427 64.8817 29.746 64.8743 29.6348C64.867 29.5236 64.7698 29.4397 64.658 29.447C64.5462 29.4543 64.4619 29.5509 64.4692 29.6622C64.4765 29.7734 64.5737 29.8573 64.6855 29.85Z" fill="#91D7EC" />
                <path id="Vector_1126" d="M63.3618 29.5363C63.25 29.529 63.1528 29.6129 63.1455 29.7242C63.1381 29.8354 63.2225 29.932 63.3343 29.9393C63.4461 29.9466 63.5433 29.8627 63.5506 29.7515C63.5579 29.6403 63.4736 29.5436 63.3618 29.5363Z" fill="#91D7EC" />
                <path id="Vector_1127" d="M62.0655 29.4488C61.9555 29.4251 61.8474 29.4944 61.8235 29.602C61.7997 29.7096 61.8694 29.819 61.9775 29.8427C62.0875 29.8664 62.1957 29.7971 62.2195 29.6895C62.2433 29.5819 62.1737 29.4725 62.0655 29.4488Z" fill="#91D7EC" />
                <path id="Vector_1128" d="M60.6816 29.56C60.7916 29.5837 60.8998 29.5145 60.9236 29.4069C60.9474 29.2993 60.8778 29.1899 60.7696 29.1662C60.6614 29.1424 60.5515 29.2117 60.5276 29.3193C60.5038 29.4269 60.5735 29.5363 60.6816 29.56Z" fill="#91D7EC" />
                <path id="Vector_1129" d="M69.1807 26.7864C69.2448 26.8776 69.3695 26.9013 69.463 26.8375C69.5565 26.7737 69.5785 26.6497 69.5143 26.5567C69.4502 26.4655 69.3255 26.4418 69.232 26.5056C69.1385 26.5694 69.1165 26.6934 69.1807 26.7864Z" fill="#91D7EC" />
                <path id="Vector_1130" d="M68.3446 27.5997C68.4454 27.5505 68.4857 27.4283 68.4344 27.3298C68.383 27.2314 68.2621 27.1894 68.1631 27.2405C68.0641 27.2915 68.0219 27.4119 68.0732 27.5104C68.1227 27.6107 68.2456 27.6508 68.3446 27.5997Z" fill="#91D7EC" />
                <path id="Vector_1131" d="M67.1325 28.2033C67.2389 28.1668 67.2957 28.0519 67.259 27.948C67.2224 27.8441 67.1069 27.7857 67.0024 27.8222C66.8961 27.8587 66.8392 27.9735 66.8759 28.0775C66.9126 28.1832 67.028 28.2398 67.1325 28.2033Z" fill="#91D7EC" />
                <path id="Vector_1132" d="M65.8497 28.6373C65.9597 28.6155 66.0312 28.5097 66.0092 28.4003C65.9872 28.2909 65.8809 28.2197 65.7709 28.2416C65.6609 28.2635 65.5894 28.3693 65.6114 28.4787C65.6334 28.5881 65.7397 28.6592 65.8497 28.6373Z" fill="#91D7EC" />
                <path id="Vector_1133" d="M64.7071 28.6811C64.7016 28.5699 64.6063 28.4842 64.4945 28.4896C64.3827 28.4951 64.2965 28.5899 64.302 28.7012C64.3075 28.8124 64.4028 28.8981 64.5147 28.8926C64.6265 28.8872 64.7126 28.7923 64.7071 28.6811Z" fill="#91D7EC" />
                <path id="Vector_1134" d="M63.1989 28.5607C63.0871 28.5498 62.9881 28.6319 62.9771 28.7431C62.9661 28.8543 63.0486 28.9528 63.1604 28.9637C63.2722 28.9747 63.3712 28.8926 63.3822 28.7814C63.3932 28.6701 63.3107 28.5717 63.1989 28.5607Z" fill="#91D7EC" />
                <path id="Vector_1135" d="M61.9081 28.4422C61.8 28.4149 61.69 28.4805 61.6625 28.5881C61.635 28.6957 61.701 28.8051 61.8092 28.8325C61.9173 28.8598 62.0273 28.7942 62.0548 28.6866C62.0823 28.579 62.0163 28.4696 61.9081 28.4422Z" fill="#91D7EC" />
                <path id="Vector_1136" d="M60.7677 28.3602C60.7952 28.2526 60.7292 28.1432 60.621 28.1158C60.5129 28.0885 60.4029 28.1541 60.3754 28.2617C60.3479 28.3693 60.4139 28.4787 60.522 28.5061C60.6302 28.5334 60.7402 28.4678 60.7677 28.3602Z" fill="#91D7EC" />
                <path id="Vector_1137" d="M68.9474 25.8199C69.0134 25.9093 69.1399 25.9312 69.2298 25.8655C69.3196 25.7999 69.3416 25.674 69.2756 25.5847C69.2096 25.4953 69.0831 25.4734 68.9933 25.5391C68.9034 25.6047 68.8814 25.7306 68.9474 25.8199Z" fill="#91D7EC" />
                <path id="Vector_1138" d="M68.1284 26.6533C68.2274 26.6022 68.2659 26.4801 68.2146 26.3816C68.1632 26.2831 68.0404 26.2448 67.9414 26.2959C67.8424 26.3469 67.8039 26.4691 67.8553 26.5676C67.9066 26.6661 68.0294 26.7044 68.1284 26.6533Z" fill="#91D7EC" />
                <path id="Vector_1139" d="M66.9217 27.2715C67.0281 27.235 67.0831 27.1201 67.0482 27.0144C67.0116 26.9086 66.8961 26.8539 66.7897 26.8885C66.6834 26.925 66.6284 27.0399 66.6633 27.1457C66.6999 27.2514 66.8154 27.3061 66.9217 27.2715Z" fill="#91D7EC" />
                <path id="Vector_1140" d="M65.6369 27.7109C65.7469 27.6909 65.8202 27.5851 65.7982 27.4757C65.778 27.3663 65.6717 27.2933 65.5617 27.3152C65.4517 27.3371 65.3784 27.4411 65.4004 27.5505C65.4206 27.6599 65.5269 27.7328 65.6369 27.7109Z" fill="#91D7EC" />
                <path id="Vector_1141" d="M64.2876 27.5523C64.1757 27.5559 64.0878 27.6489 64.0914 27.7602C64.0951 27.8714 64.1886 27.959 64.3004 27.9553C64.4122 27.9517 64.5002 27.8587 64.4966 27.7474C64.4929 27.6362 64.3994 27.5486 64.2876 27.5523Z" fill="#91D7EC" />
                <path id="Vector_1142" d="M62.9915 27.5998C62.8797 27.587 62.7788 27.6654 62.766 27.7748C62.7532 27.886 62.832 27.9863 62.942 27.9991C63.0538 28.0119 63.1547 27.9335 63.1675 27.824C63.1803 27.7128 63.1015 27.6125 62.9915 27.5998Z" fill="#91D7EC" />
                <path id="Vector_1143" d="M61.7066 27.4429C61.5984 27.4119 61.4866 27.4721 61.4554 27.5797C61.4243 27.6872 61.4848 27.7985 61.5929 27.8295C61.7011 27.8605 61.8129 27.8003 61.8441 27.6927C61.8753 27.5851 61.8148 27.4739 61.7066 27.4429Z" fill="#91D7EC" />
                <path id="Vector_1144" d="M60.3185 27.4593C60.4267 27.4903 60.5385 27.4301 60.5697 27.3225C60.6008 27.2149 60.5403 27.1037 60.4322 27.0727C60.324 27.0417 60.2122 27.1019 60.181 27.2095C60.1499 27.3171 60.2104 27.4283 60.3185 27.4593Z" fill="#91D7EC" />
                <path id="Vector_1145" d="M68.6762 24.9081C68.7441 24.9975 68.8706 25.0157 68.9604 24.9483C69.0502 24.8808 69.0686 24.755 69.0007 24.6656C68.9329 24.5763 68.8064 24.558 68.7166 24.6255C68.6267 24.693 68.6084 24.8188 68.6762 24.9081Z" fill="#91D7EC" />
                <path id="Vector_1146" d="M67.8699 25.7561C67.9688 25.7051 68.0073 25.5829 67.9542 25.4844C67.9028 25.3859 67.78 25.3476 67.681 25.4005C67.582 25.4516 67.5435 25.5738 67.5967 25.6722C67.648 25.7707 67.7709 25.809 67.8699 25.7561Z" fill="#91D7EC" />
                <path id="Vector_1147" d="M66.6653 26.3834C66.7716 26.3469 66.8284 26.2339 66.7917 26.1281C66.7551 26.0224 66.6414 25.9658 66.5351 26.0023C66.4288 26.0388 66.3719 26.1518 66.4086 26.2576C66.4453 26.3634 66.5589 26.4199 66.6653 26.3834Z" fill="#91D7EC" />
                <path id="Vector_1148" d="M65.3786 26.8156C65.4885 26.7974 65.5637 26.6916 65.5435 26.5822C65.5252 26.4728 65.4189 26.398 65.3089 26.4181C65.1989 26.4363 65.1237 26.5421 65.1439 26.6515C65.1641 26.7609 65.2686 26.8357 65.3786 26.8156Z" fill="#91D7EC" />
                <path id="Vector_1149" d="M64.0348 26.6405C63.923 26.6405 63.8332 26.7335 63.835 26.8448C63.835 26.956 63.9285 27.0454 64.0403 27.0435C64.1521 27.0435 64.242 26.9505 64.2401 26.8393C64.2401 26.7281 64.1466 26.6387 64.0348 26.6405Z" fill="#91D7EC" />
                <path id="Vector_1150" d="M62.7386 26.6569C62.6286 26.6405 62.5241 26.7153 62.5076 26.8247C62.4911 26.9341 62.5663 27.038 62.6763 27.0545C62.7863 27.0709 62.8908 26.9961 62.9073 26.8867C62.9238 26.7773 62.8486 26.6733 62.7386 26.6569Z" fill="#91D7EC" />
                <path id="Vector_1151" d="M61.4607 26.46C61.3543 26.4235 61.2388 26.4801 61.204 26.5858C61.1673 26.6916 61.2242 26.8065 61.3305 26.8411C61.4368 26.8758 61.5523 26.8211 61.5872 26.7153C61.6238 26.6095 61.567 26.4946 61.4607 26.46Z" fill="#91D7EC" />
                <path id="Vector_1152" d="M60.0732 26.418C60.1795 26.4545 60.295 26.398 60.3298 26.2922C60.3647 26.1864 60.3097 26.0715 60.2033 26.0369C60.097 26.0004 59.9815 26.057 59.9467 26.1627C59.91 26.2685 59.9669 26.3834 60.0732 26.418Z" fill="#91D7EC" />
                <path id="Vector_1153" d="M68.3737 24.0657C68.4415 24.155 68.568 24.1714 68.6578 24.104C68.7477 24.0365 68.7642 23.9107 68.6963 23.8213C68.6285 23.732 68.502 23.7155 68.4122 23.783C68.3224 23.8505 68.3059 23.9763 68.3737 24.0657Z" fill="#91D7EC" />
                <path id="Vector_1154" d="M67.3818 24.5635C67.2829 24.6146 67.2444 24.7367 67.2957 24.8352C67.347 24.9337 67.4698 24.972 67.5688 24.9209C67.6678 24.8699 67.7063 24.7477 67.655 24.6492C67.6037 24.5507 67.4808 24.5124 67.3818 24.5635Z" fill="#91D7EC" />
                <path id="Vector_1155" d="M66.4931 25.2911C66.4582 25.1853 66.3446 25.127 66.2364 25.1616C66.1301 25.1963 66.0714 25.3093 66.1062 25.4151C66.1411 25.5209 66.2547 25.5792 66.3611 25.5446C66.4674 25.5099 66.5261 25.3968 66.4912 25.2893L66.4931 25.2911Z" fill="#91D7EC" />
                <path id="Vector_1156" d="M65.2392 25.7378C65.2227 25.6284 65.12 25.5518 65.0082 25.5683C64.8982 25.5847 64.8212 25.6868 64.8377 25.798C64.8542 25.9074 64.9568 25.984 65.0687 25.9676C65.1787 25.9512 65.2557 25.8491 65.2392 25.7378Z" fill="#91D7EC" />
                <path id="Vector_1157" d="M63.721 26.1664C63.8328 26.1682 63.9263 26.0807 63.9281 25.9695C63.93 25.8582 63.842 25.7652 63.7301 25.7634C63.6183 25.7616 63.5248 25.8491 63.523 25.9603C63.5211 26.0716 63.6091 26.1646 63.721 26.1664Z" fill="#91D7EC" />
                <path id="Vector_1158" d="M62.1993 25.8965C62.1773 26.0059 62.2488 26.1117 62.3588 26.1336C62.4688 26.1554 62.5751 26.0843 62.5971 25.9749C62.6191 25.8655 62.5476 25.7597 62.4376 25.7378C62.3276 25.716 62.2213 25.7871 62.1993 25.8965Z" fill="#91D7EC" />
                <path id="Vector_1159" d="M61.2849 25.7525C61.3253 25.6485 61.274 25.5318 61.1695 25.4917C61.065 25.4516 60.9476 25.5026 60.9073 25.6066C60.867 25.7105 60.9183 25.8272 61.0228 25.8674C61.1273 25.9075 61.2446 25.8564 61.2849 25.7525Z" fill="#91D7EC" />
                <path id="Vector_1160" d="M59.8674 25.4052C59.9796 25.3998 60.0662 25.3049 60.0608 25.1932C60.0554 25.0816 59.96 24.9954 59.8478 25.0008C59.7355 25.0062 59.6489 25.1011 59.6543 25.2127C59.6597 25.3244 59.7551 25.4106 59.8674 25.4052Z" fill="#91D7EC" />
                <path id="Vector_1161" d="M68.0346 23.3125C68.1025 23.4019 68.229 23.4201 68.3188 23.3526C68.4086 23.2851 68.427 23.1593 68.3591 23.07C68.2913 22.9806 68.1648 22.9624 68.075 23.0298C67.9851 23.0973 67.9668 23.2231 68.0346 23.3125Z" fill="#91D7EC" />
                <path id="Vector_1162" d="M67.2262 24.1641C67.3252 24.1131 67.3655 23.9927 67.3142 23.8924C67.2628 23.7939 67.1418 23.7538 67.041 23.8049C66.942 23.8559 66.9017 23.9763 66.953 24.0766C67.0043 24.1751 67.1253 24.2152 67.2262 24.1641Z" fill="#91D7EC" />
                <path id="Vector_1163" d="M66.1449 24.5233C66.1119 24.4176 65.9982 24.3574 65.8919 24.3884C65.7856 24.4212 65.7251 24.5343 65.7562 24.64C65.7892 24.7458 65.9029 24.806 66.0092 24.775C66.1155 24.7422 66.176 24.6291 66.1449 24.5233Z" fill="#91D7EC" />
                <path id="Vector_1164" d="M64.7054 25.1671C64.8172 25.1543 64.896 25.054 64.8832 24.9428C64.8704 24.8315 64.7695 24.7531 64.6577 24.7659C64.5459 24.7787 64.4671 24.8789 64.4799 24.9902C64.4927 25.1014 64.5935 25.1798 64.7054 25.1671Z" fill="#91D7EC" />
                <path id="Vector_1165" d="M63.3488 25.3239C63.4606 25.3312 63.556 25.2455 63.5633 25.1343C63.5706 25.023 63.4845 24.9282 63.3726 24.9209C63.2608 24.9136 63.1655 24.9993 63.1582 25.1106C63.1508 25.2218 63.237 25.3166 63.3488 25.3239Z" fill="#91D7EC" />
                <path id="Vector_1166" d="M61.9886 25.24C62.0968 25.2674 62.2068 25.1999 62.2343 25.0923C62.2618 24.9847 62.1939 24.8753 62.0858 24.848C61.9776 24.8206 61.8676 24.8881 61.8401 24.9957C61.8126 25.1033 61.8804 25.2127 61.9886 25.24Z" fill="#91D7EC" />
                <path id="Vector_1167" d="M60.8299 24.5434C60.7272 24.4978 60.6081 24.5434 60.5622 24.6437C60.5164 24.744 60.5622 24.8644 60.6631 24.9099C60.7657 24.9555 60.8849 24.9099 60.9307 24.8097C60.9766 24.7075 60.9307 24.589 60.8299 24.5434Z" fill="#91D7EC" />
                <path id="Vector_1168" d="M59.4536 24.3702C59.5563 24.4158 59.6754 24.3702 59.7212 24.2699C59.7671 24.1696 59.7212 24.0493 59.6204 24.0037C59.5178 23.9581 59.3986 24.0037 59.3528 24.104C59.3069 24.2061 59.3528 24.3246 59.4536 24.3702Z" fill="#91D7EC" />
                <path id="Vector_1169" d="M67.9412 22.7052C68.031 22.6396 68.053 22.5138 67.987 22.4244C67.921 22.3351 67.7945 22.3132 67.7047 22.3788C67.6149 22.4445 67.5929 22.5703 67.6589 22.6596C67.7249 22.749 67.8514 22.7709 67.9412 22.7052Z" fill="#91D7EC" />
                <path id="Vector_1170" d="M66.5626 23.4019C66.6102 23.5022 66.7312 23.5441 66.832 23.4967C66.9329 23.4493 66.975 23.3289 66.9274 23.2286C66.8797 23.1283 66.7587 23.0864 66.6579 23.1338C66.5571 23.1812 66.5149 23.3016 66.5626 23.4019Z" fill="#91D7EC" />
                <path id="Vector_1171" d="M65.3528 23.938C65.3821 24.0456 65.4921 24.1094 65.6003 24.0802C65.7085 24.0511 65.7726 23.9417 65.7433 23.8341C65.714 23.7265 65.604 23.6626 65.4958 23.6918C65.3876 23.721 65.3235 23.8304 65.3528 23.938Z" fill="#91D7EC" />
                <path id="Vector_1172" d="M64.2801 24.4285C64.392 24.4194 64.4745 24.3228 64.4671 24.2115C64.458 24.1003 64.3608 24.0182 64.249 24.0255C64.1371 24.0347 64.0546 24.1313 64.062 24.2425C64.0693 24.3538 64.1683 24.4358 64.2801 24.4285Z" fill="#91D7EC" />
                <path id="Vector_1173" d="M62.9198 24.5289C63.0316 24.5416 63.1306 24.4614 63.1434 24.3502C63.1563 24.2389 63.0756 24.1404 62.9638 24.1277C62.8519 24.1149 62.7529 24.1951 62.7401 24.3064C62.7273 24.4176 62.8079 24.5161 62.9198 24.5289Z" fill="#91D7EC" />
                <path id="Vector_1174" d="M61.5633 24.3775C61.6696 24.4103 61.7832 24.3502 61.8162 24.2444C61.8492 24.1386 61.7887 24.0256 61.6824 23.9927C61.5761 23.9599 61.4624 24.0201 61.4294 24.1259C61.3964 24.2316 61.4569 24.3447 61.5633 24.3775Z" fill="#91D7EC" />
                <path id="Vector_1175" d="M60.1736 23.7027C60.1223 23.8012 60.1608 23.9234 60.2598 23.9745C60.3588 24.0255 60.4816 23.9872 60.5329 23.8888C60.5843 23.7903 60.5458 23.6681 60.4468 23.617C60.3478 23.566 60.2249 23.6043 60.1736 23.7027Z" fill="#91D7EC" />
                <path id="Vector_1176" d="M59.0811 23.3617C59.1801 23.4128 59.3029 23.3745 59.3542 23.276C59.4055 23.1775 59.367 23.0554 59.2681 23.0043C59.1691 22.9532 59.0462 22.9915 58.9949 23.09C58.9436 23.1885 58.9821 23.3107 59.0811 23.3617Z" fill="#91D7EC" />
                <path id="Vector_1177" d="M67.5158 22.1819C67.6093 22.1199 67.6331 21.9941 67.5708 21.9029C67.5085 21.8099 67.382 21.7862 67.2903 21.8482C67.1968 21.9102 67.173 22.036 67.2353 22.1272C67.2977 22.2184 67.4241 22.2439 67.5158 22.1819Z" fill="#91D7EC" />
                <path id="Vector_1178" d="M66.3813 22.9387C66.484 22.8949 66.5316 22.7764 66.4877 22.6743C66.4437 22.5721 66.3245 22.5247 66.2218 22.5685C66.1192 22.6123 66.0715 22.7308 66.1155 22.8329C66.1595 22.935 66.2787 22.9824 66.3813 22.9387Z" fill="#91D7EC" />
                <path id="Vector_1179" d="M65.0394 23.0755C64.9294 23.0992 64.8615 23.2068 64.8835 23.3162C64.9074 23.4256 65.0155 23.4931 65.1255 23.4712C65.2355 23.4475 65.3033 23.3399 65.2813 23.2305C65.2593 23.121 65.1493 23.0536 65.0394 23.0755Z" fill="#91D7EC" />
                <path id="Vector_1180" d="M63.7796 23.3526C63.6677 23.3545 63.5797 23.4475 63.5816 23.5587C63.5834 23.6699 63.6769 23.7575 63.7887 23.7556C63.9006 23.7538 63.9886 23.6608 63.9867 23.5496C63.9849 23.4383 63.8914 23.3508 63.7796 23.3526Z" fill="#91D7EC" />
                <path id="Vector_1181" d="M62.6559 23.6171C62.6742 23.5077 62.6009 23.4037 62.4909 23.3837C62.3809 23.3654 62.2764 23.4384 62.2562 23.5478C62.2379 23.6572 62.3112 23.7611 62.4212 23.7812C62.5312 23.7994 62.6357 23.7265 62.6559 23.6171Z" fill="#91D7EC" />
                <path id="Vector_1182" d="M61.2205 23.1685C61.116 23.1283 60.9987 23.1812 60.9583 23.2852C60.918 23.3891 60.9712 23.5058 61.0757 23.5459C61.1802 23.5861 61.2975 23.5332 61.3378 23.4292C61.3781 23.3253 61.325 23.2086 61.2205 23.1685Z" fill="#91D7EC" />
                <path id="Vector_1183" d="M60.038 22.9624C60.0545 22.9332 60.0783 22.9113 60.104 22.8931C60.1058 22.8219 60.0747 22.7526 60.0105 22.7144C59.9152 22.656 59.7905 22.687 59.7318 22.7818C59.6732 22.8767 59.7043 23.0007 59.7997 23.059C59.8693 23.101 59.9518 23.0955 60.016 23.0554C60.016 23.0244 60.0233 22.9934 60.038 22.9642V22.9624Z" fill="#91D7EC" />
                <path id="Vector_1184" d="M58.9695 22.2421C58.9878 22.16 58.9566 22.0725 58.8796 22.0251C58.7843 21.9667 58.6596 21.9977 58.601 22.0926C58.5423 22.1874 58.5735 22.3114 58.6688 22.3697C58.7293 22.4062 58.799 22.4044 58.8576 22.377C58.865 22.3479 58.876 22.3205 58.8961 22.2968C58.9163 22.2713 58.942 22.2549 58.9695 22.2421Z" fill="#91D7EC" />
                <path id="Vector_1185" d="M67.0282 21.8008C67.1236 21.7443 67.1547 21.6203 67.0979 21.5236C67.0411 21.427 66.9164 21.3978 66.8192 21.4543C66.7239 21.5108 66.6927 21.6348 66.7496 21.7315C66.8064 21.8263 66.9311 21.8573 67.0282 21.8008Z" fill="#91D7EC" />
                <path id="Vector_1186" d="M65.7173 22.1199C65.6128 22.1582 65.5578 22.2731 65.5963 22.3789C65.6348 22.4828 65.7503 22.5375 65.8566 22.4992C65.9629 22.4609 66.0161 22.346 65.9776 22.2403C65.9391 22.1363 65.8236 22.0816 65.7173 22.1199Z" fill="#91D7EC" />
                <path id="Vector_1187" d="M64.7368 22.7272C64.7203 22.6178 64.6176 22.5412 64.5058 22.5576C64.3939 22.574 64.3188 22.6761 64.3353 22.7873C64.3518 22.8968 64.4544 22.9733 64.5663 22.9569C64.6763 22.9405 64.7533 22.8384 64.7368 22.7272Z" fill="#91D7EC" />
                <path id="Vector_1188" d="M63.4259 22.9642C63.4314 22.853 63.3452 22.7582 63.2334 22.7527C63.1216 22.7472 63.0263 22.8329 63.0208 22.9442C63.0153 23.0554 63.1014 23.1502 63.2132 23.1557C63.3251 23.1612 63.4204 23.0755 63.4259 22.9642Z" fill="#91D7EC" />
                <path id="Vector_1189" d="M62.0948 22.9368C62.1223 22.8293 62.0563 22.7198 61.9482 22.6925C61.84 22.6651 61.73 22.7308 61.7025 22.8384C61.675 22.946 61.741 23.0554 61.8492 23.0827C61.9574 23.1101 62.0673 23.0444 62.0948 22.9368Z" fill="#91D7EC" />
                <path id="Vector_1190" d="M60.6979 22.3825C60.5971 22.3351 60.4761 22.3788 60.4284 22.4791C60.3808 22.5794 60.4248 22.6998 60.5256 22.7472C60.6264 22.7946 60.7474 22.7509 60.7951 22.6506C60.8427 22.5503 60.7987 22.4299 60.6979 22.3825Z" fill="#91D7EC" />
                <path id="Vector_1191" d="M59.5744 22.1181C59.6404 22.0269 59.6184 21.9011 59.5286 21.8373C59.4369 21.7716 59.3104 21.7935 59.2463 21.8828C59.1803 21.974 59.2023 22.0998 59.2921 22.1637C59.3838 22.2293 59.5103 22.2074 59.5744 22.1181Z" fill="#91D7EC" />
                <path id="Vector_1192" d="M58.4101 21.0458C58.3258 21.0112 58.225 21.0331 58.1681 21.1097C58.1021 21.2008 58.1241 21.3267 58.214 21.3905C58.3056 21.4561 58.4321 21.4342 58.4963 21.3449C58.5403 21.2829 58.5421 21.2063 58.5128 21.1425C58.4908 21.1334 58.4706 21.1224 58.4523 21.106C58.434 21.0878 58.4193 21.0677 58.4083 21.0458H58.4101Z" fill="#91D7EC" />
                <path id="Vector_1193" d="M66.4563 21.5856C66.5571 21.5345 66.5956 21.4142 66.5461 21.3139C66.4966 21.2136 66.3738 21.1753 66.2729 21.2245C66.1721 21.2756 66.1336 21.3959 66.1831 21.4962C66.2344 21.5965 66.3554 21.6348 66.4563 21.5856Z" fill="#91D7EC" />
                <path id="Vector_1194" d="M64.9842 22.0524C65.0135 22.16 65.1253 22.2239 65.2335 22.1947C65.3416 22.1655 65.4058 22.0543 65.3765 21.9467C65.3471 21.8391 65.2353 21.7753 65.1271 21.8044C65.019 21.8336 64.9548 21.9448 64.9842 22.0524Z" fill="#91D7EC" />
                <path id="Vector_1195" d="M63.6953 22.3606C63.7026 22.4718 63.7979 22.5557 63.9098 22.5484C64.0216 22.5411 64.1059 22.4463 64.0986 22.3351C64.0912 22.2238 63.9959 22.1399 63.8841 22.1472C63.7723 22.1545 63.6879 22.2494 63.6953 22.3606Z" fill="#91D7EC" />
                <path id="Vector_1196" d="M62.4032 22.3223C62.4325 22.366 62.4454 22.4189 62.4344 22.4736C62.4289 22.4992 62.4197 22.5211 62.405 22.5429C62.4362 22.5885 62.4839 22.6213 62.5425 22.6305C62.6525 22.6469 62.7552 22.5685 62.7717 22.4591C62.7882 22.3496 62.7093 22.2475 62.5994 22.2311C62.5187 22.2202 62.4435 22.2585 62.4014 22.3223H62.4032Z" fill="#91D7EC" />
                <path id="Vector_1197" d="M61.118 22.1035C61.1381 22.1509 61.1418 22.2074 61.118 22.2585C61.107 22.2858 61.0905 22.3077 61.0703 22.3259C61.0923 22.3752 61.1326 22.4171 61.1876 22.4354C61.294 22.4718 61.4095 22.4171 61.4461 22.3132C61.4828 22.2074 61.4278 22.0925 61.3233 22.056C61.2481 22.0305 61.1693 22.0506 61.1161 22.1016L61.118 22.1035Z" fill="#91D7EC" />
                <path id="Vector_1198" d="M59.9007 21.6367C59.9117 21.6877 59.9044 21.7424 59.8732 21.7898C59.8567 21.8154 59.8329 21.8354 59.8091 21.85C59.8219 21.9029 59.8531 21.9503 59.9026 21.9795C59.9997 22.036 60.1226 22.0032 60.1794 21.9084C60.2362 21.8117 60.2032 21.6895 60.1079 21.633C60.0419 21.5947 59.9631 21.6002 59.9007 21.6367Z" fill="#91D7EC" />
                <path id="Vector_1199" d="M58.7403 21.0969C58.7165 21.1206 58.689 21.137 58.6597 21.1479C58.6633 21.2008 58.6853 21.2537 58.7293 21.2902C58.8137 21.3631 58.942 21.3522 59.0153 21.2683C59.0886 21.1844 59.0776 21.0567 58.9933 20.9838C58.9365 20.9346 58.8613 20.9273 58.7953 20.951C58.7972 21.0039 58.7807 21.0567 58.7422 21.0987L58.7403 21.0969Z" fill="#91D7EC" />
                <path id="Vector_1200" d="M57.745 20.2179C57.7175 20.2398 57.6863 20.2508 57.6533 20.2562C57.646 20.3201 57.6661 20.3857 57.7193 20.4313C57.8036 20.5042 57.932 20.4933 58.0053 20.4094C58.0786 20.3255 58.0676 20.1979 57.9833 20.1249C57.9356 20.0848 57.877 20.0721 57.8201 20.0812C57.8146 20.1341 57.789 20.1833 57.745 20.2179Z" fill="#91D7EC" />
                <path id="Vector_1201" d="M65.7576 21.5546C65.8621 21.5145 65.9152 21.3978 65.8749 21.2938C65.8346 21.1899 65.7173 21.137 65.6128 21.1771C65.5083 21.2172 65.4551 21.334 65.4954 21.4379C65.5358 21.5418 65.6531 21.5947 65.7576 21.5546Z" fill="#91D7EC" />
                <path id="Vector_1202" d="M64.4783 22.036C64.5883 22.0178 64.6635 21.9156 64.647 21.8044C64.6305 21.6932 64.526 21.6202 64.4141 21.6366C64.3023 21.6531 64.229 21.757 64.2455 21.8682C64.262 21.9795 64.3665 22.0524 64.4783 22.036Z" fill="#91D7EC" />
                <path id="Vector_1203" d="M63.1254 22.2476C63.2372 22.253 63.3325 22.1673 63.338 22.0561C63.3435 21.9448 63.2573 21.85 63.1455 21.8445C63.0337 21.8391 62.9384 21.9248 62.9329 22.036C62.9274 22.1473 63.0135 22.2421 63.1254 22.2476Z" fill="#91D7EC" />
                <path id="Vector_1204" d="M61.7576 22.1782C61.8658 22.2056 61.9758 22.1418 62.0051 22.0342C62.0326 21.9266 61.9685 21.8172 61.8603 21.788C61.7521 21.7606 61.6421 21.8245 61.6128 21.9321C61.5853 22.0397 61.6495 22.1491 61.7576 22.1782Z" fill="#91D7EC" />
                <path id="Vector_1205" d="M60.4341 21.8354C60.5349 21.8847 60.6559 21.8427 60.7054 21.7424C60.7146 21.7224 60.7182 21.7023 60.7219 21.6823C60.7091 21.6513 60.7072 21.6166 60.7109 21.582C60.6926 21.5364 60.6596 21.4963 60.6119 21.4744C60.5111 21.4251 60.3901 21.4671 60.3406 21.5674C60.2911 21.6677 60.3332 21.788 60.4341 21.8373V21.8354Z" fill="#91D7EC" />
                <path id="Vector_1206" d="M59.4902 21.199C59.4902 21.199 59.4938 21.1881 59.4975 21.1844C59.47 21.1242 59.47 21.0549 59.5085 20.9966C59.4938 20.9674 59.4755 20.9401 59.448 20.9182C59.3582 20.8525 59.2317 20.8708 59.1639 20.9601C59.096 21.0495 59.1162 21.1753 59.206 21.2428C59.2959 21.3084 59.4224 21.2902 59.4902 21.2008V21.199Z" fill="#91D7EC" />
                <path id="Vector_1207" d="M58.3809 20.4514C58.3534 20.3821 58.3663 20.3 58.4213 20.2416C58.4286 20.2325 58.4396 20.2289 58.4488 20.2234C58.4396 20.1997 58.4249 20.176 58.4048 20.1559C58.3278 20.0757 58.1994 20.0739 58.1188 20.1523C58.0381 20.2289 58.0363 20.3565 58.1151 20.4368C58.1885 20.5115 58.3021 20.5152 58.3828 20.4532L58.3809 20.4514Z" fill="#91D7EC" />
                <path id="Vector_1208" d="M57.4057 19.5359C57.3818 19.4593 57.4057 19.3718 57.4735 19.3189C57.49 19.3061 57.5083 19.3006 57.5248 19.2934C57.5157 19.2624 57.5028 19.2332 57.479 19.2095C57.402 19.1292 57.2737 19.1274 57.193 19.2058C57.1123 19.2824 57.1105 19.4101 57.1893 19.4903C57.248 19.5505 57.3342 19.5669 57.4075 19.5377L57.4057 19.5359Z" fill="#91D7EC" />
                <path id="Vector_1209" d="M64.8799 21.7224C64.9881 21.6968 65.0559 21.5892 65.0321 21.4798C65.0064 21.3722 64.8983 21.3048 64.7883 21.3285C64.6801 21.354 64.6123 21.4616 64.6361 21.571C64.6618 21.6786 64.7699 21.7461 64.8799 21.7224Z" fill="#91D7EC" />
                <path id="Vector_1210" d="M63.5433 22.0269C63.5543 22.0269 63.5617 22.0214 63.5727 22.0196C63.5452 21.9868 63.5232 21.9466 63.5213 21.8992C63.5158 21.7971 63.591 21.7114 63.6918 21.695C63.6533 21.6512 63.5983 21.622 63.536 21.6239C63.4242 21.6257 63.3343 21.7187 63.338 21.8299C63.3417 21.9412 63.4333 22.0305 63.5452 22.0269H63.5433Z" fill="#91D7EC" />
                <path id="Vector_1211" d="M62.174 22.047C62.1905 22.0506 62.2052 22.047 62.2217 22.047C62.2015 22.0087 62.1887 21.9649 62.196 21.9193C62.2125 21.8227 62.2932 21.7589 62.3867 21.7534C62.3592 21.7023 62.3115 21.6622 62.2492 21.6513C62.1392 21.6312 62.0328 21.7023 62.0127 21.8117C61.9925 21.9212 62.064 22.0269 62.174 22.047Z" fill="#91D7EC" />
                <path id="Vector_1212" d="M60.7202 21.6804C60.7404 21.7278 60.7789 21.7679 60.8302 21.7898C60.8522 21.7989 60.8742 21.8007 60.8962 21.8026C60.8833 21.7606 60.8797 21.715 60.8962 21.6713C60.9292 21.5874 61.0117 21.54 61.0978 21.5436C61.0795 21.4889 61.0428 21.4397 60.9842 21.416C60.8815 21.374 60.7624 21.4233 60.7202 21.5254C60.7129 21.5436 60.711 21.5619 60.7092 21.5801C60.7055 21.6147 60.7074 21.6494 60.7202 21.6804Z" fill="#91D7EC" />
                <path id="Vector_1213" d="M59.4972 21.1844C59.5118 21.219 59.5338 21.25 59.5687 21.2719C59.5925 21.2883 59.62 21.2974 59.6475 21.3011C59.6402 21.2555 59.6475 21.2081 59.6732 21.1662C59.7172 21.095 59.7997 21.0604 59.8785 21.0731C59.8712 21.0184 59.8418 20.9656 59.7905 20.9327C59.697 20.8726 59.5705 20.8981 59.51 20.9911C59.51 20.9911 59.51 20.9929 59.51 20.9947C59.4733 21.0531 59.4733 21.1242 59.499 21.1826L59.4972 21.1844Z" fill="#91D7EC" />
                <path id="Vector_1214" d="M58.3807 20.4513C58.3917 20.4787 58.4064 20.5042 58.4302 20.5261C58.4541 20.5498 58.4852 20.5626 58.5146 20.5699C58.5146 20.5243 58.5311 20.4787 58.564 20.4422C58.6172 20.3839 58.6979 20.3638 58.7694 20.3839C58.7694 20.3273 58.751 20.2726 58.707 20.2307C58.6337 20.1632 58.5237 20.1614 58.4467 20.2216C58.4376 20.2289 58.4284 20.2325 58.4192 20.2398C58.3642 20.2981 58.3532 20.3802 58.3789 20.4495L58.3807 20.4513Z" fill="#91D7EC" />
                <path id="Vector_1215" d="M57.4058 19.5359C57.4132 19.5596 57.4223 19.5815 57.4388 19.6015C57.4627 19.6307 57.4938 19.6489 57.5268 19.6617C57.536 19.6161 57.5562 19.5724 57.5947 19.5414C57.6533 19.4939 57.7285 19.4866 57.7945 19.5122C57.8055 19.4575 57.7945 19.3991 57.756 19.3517C57.6992 19.2806 57.6038 19.2605 57.5232 19.2915C57.5048 19.2988 57.4865 19.3043 57.4718 19.3171C57.404 19.3699 57.3802 19.4575 57.404 19.5341L57.4058 19.5359Z" fill="#91D7EC" />
                <path id="Vector_1216" d="M56.6905 18.6186C56.7052 18.573 56.7327 18.5311 56.7767 18.5037C56.8372 18.4673 56.9068 18.4691 56.9673 18.4965C56.9857 18.4363 56.9783 18.367 56.9362 18.3141C56.8665 18.2266 56.74 18.212 56.652 18.2794C56.564 18.3487 56.5494 18.4746 56.6172 18.5621C56.6374 18.5876 56.663 18.604 56.6905 18.6186Z" fill="#91D7EC" />
                <path id="Vector_1217" d="M63.5215 21.8992C63.5233 21.9466 63.5435 21.9868 63.5728 22.0196C63.6113 22.0652 63.6682 22.0944 63.7341 22.0925C63.846 22.0871 63.9321 21.9922 63.9266 21.881C63.9211 21.7698 63.8258 21.684 63.714 21.6895C63.7048 21.6895 63.6993 21.6932 63.6902 21.695C63.5912 21.7114 63.516 21.7971 63.5197 21.8992H63.5215Z" fill="#91D7EC" />
                <path id="Vector_1218" d="M62.1956 21.9193C62.1883 21.9649 62.1993 22.0087 62.2213 22.047C62.2506 22.0999 62.3001 22.14 62.3643 22.1509C62.4743 22.1691 62.5788 22.0944 62.5971 21.985C62.6154 21.8756 62.5403 21.7716 62.4303 21.7534C62.4156 21.7516 62.4028 21.7534 62.3899 21.7534C62.2964 21.757 62.214 21.8227 62.1993 21.9193H62.1956Z" fill="#91D7EC" />
                <path id="Vector_1219" d="M60.896 21.6713C60.8795 21.7151 60.8813 21.7606 60.896 21.8026C60.9143 21.8591 60.9546 21.9084 61.0133 21.9302C61.1178 21.9704 61.2351 21.9175 61.2755 21.8135C61.3158 21.7096 61.2626 21.5929 61.1581 21.5528C61.138 21.5455 61.1178 21.5436 61.0976 21.5436C61.0115 21.5382 60.929 21.5856 60.896 21.6713Z" fill="#91D7EC" />
                <path id="Vector_1220" d="M59.6714 21.1662C59.6458 21.2081 59.6384 21.2555 59.6458 21.3011C59.6531 21.3576 59.6843 21.4123 59.7374 21.4433C59.8328 21.5017 59.9574 21.4725 60.0161 21.3777C60.0747 21.2829 60.0454 21.1589 59.9501 21.1005C59.9262 21.0859 59.9024 21.0768 59.8767 21.0732C59.7979 21.0604 59.7154 21.095 59.6714 21.1662Z" fill="#91D7EC" />
                <path id="Vector_1221" d="M58.5623 20.444C58.5293 20.4805 58.5146 20.5261 58.5128 20.5717C58.511 20.63 58.5311 20.6866 58.577 20.7285C58.5971 20.7467 58.621 20.7595 58.6448 20.7686C58.6503 20.7686 58.6558 20.7686 58.6595 20.7723C58.731 20.7905 58.8098 20.7723 58.863 20.7139C58.9381 20.63 58.9308 20.5042 58.8465 20.4294C58.8226 20.4076 58.7951 20.3948 58.7658 20.3875C58.6943 20.3674 58.6136 20.3875 58.5605 20.4458L58.5623 20.444Z" fill="#91D7EC" />
                <path id="Vector_1222" d="M57.5963 19.5413C57.5578 19.5723 57.5358 19.6161 57.5284 19.6617C57.5174 19.7182 57.5284 19.7784 57.5688 19.8258C57.5816 19.8404 57.5981 19.8514 57.6128 19.8623C57.6549 19.8623 57.6971 19.8714 57.7319 19.8969C57.7741 19.8969 57.8181 19.8842 57.8529 19.855C57.9391 19.7839 57.9519 19.6581 57.8804 19.5705C57.8566 19.5413 57.8272 19.5249 57.7943 19.5122C57.7283 19.4866 57.6531 19.4939 57.5944 19.5413H57.5963Z" fill="#91D7EC" />
                <path id="Vector_1223" d="M56.7769 18.5038C56.7329 18.5311 56.7054 18.5731 56.6907 18.6187C56.6742 18.6715 56.6779 18.7317 56.7109 18.7828C56.7219 18.801 56.7384 18.8156 56.7549 18.8302C56.8154 18.8174 56.8759 18.8338 56.9235 18.8721C56.9455 18.8667 56.9694 18.8612 56.9895 18.8484C57.0849 18.7901 57.1142 18.6661 57.0555 18.5712C57.0335 18.5366 57.0024 18.5147 56.9675 18.4983C56.907 18.4709 56.8374 18.4691 56.7769 18.5056V18.5038Z" fill="#91D7EC" />
                <path id="Vector_1224" d="M56.2491 17.7397C56.2638 17.7342 56.2784 17.7324 56.2913 17.7233C56.3866 17.6649 56.4159 17.5409 56.3573 17.4461C56.2986 17.3513 56.1739 17.3221 56.0786 17.3804C55.9833 17.4388 55.954 17.5628 56.0126 17.6576C56.0236 17.674 56.0383 17.6868 56.053 17.6996C56.1226 17.6777 56.1978 17.6923 56.2491 17.7379V17.7397Z" fill="#91D7EC" />
                <path id="Vector_1225" d="M62.4028 22.3223C62.3734 22.2804 62.3295 22.2476 62.2745 22.2384C62.1645 22.2166 62.0581 22.2895 62.0361 22.3971C62.0141 22.5047 62.0875 22.6123 62.1956 22.6342C62.28 22.6506 62.3606 22.6123 62.4046 22.543C62.4174 22.5229 62.4284 22.4992 62.4339 22.4737C62.4449 22.419 62.4321 22.3643 62.4028 22.3223Z" fill="#91D7EC" />
                <path id="Vector_1226" d="M61.1196 22.2603C61.1416 22.2074 61.138 22.1527 61.1196 22.1053C61.0995 22.0579 61.061 22.0196 61.0115 21.9977C60.9088 21.9558 60.7896 22.005 60.7475 22.1071C60.7053 22.2092 60.7548 22.3278 60.8575 22.3697C60.9345 22.4007 61.0188 22.3825 61.0756 22.3278C61.0958 22.3095 61.1123 22.2858 61.1233 22.2603H61.1196Z" fill="#91D7EC" />
                <path id="Vector_1227" d="M59.8733 21.7916C59.9045 21.7442 59.9118 21.6895 59.9008 21.6385C59.8898 21.5892 59.8605 21.5436 59.8146 21.5145C59.7212 21.4543 59.5947 21.4798 59.5342 21.5728C59.4737 21.6658 59.4993 21.7916 59.5928 21.8518C59.6607 21.8956 59.745 21.8919 59.8091 21.8518C59.8348 21.8372 59.8568 21.8172 59.8733 21.7916Z" fill="#91D7EC" />
                <path id="Vector_1228" d="M58.4435 20.8215C58.3848 20.8835 58.3757 20.9729 58.4105 21.0458C58.4215 21.0677 58.4343 21.0896 58.4545 21.106C58.4728 21.1224 58.493 21.1334 58.515 21.1425C58.5626 21.1625 58.614 21.1625 58.6616 21.1461C58.691 21.1352 58.7203 21.1206 58.7423 21.0951C58.7808 21.0531 58.7991 21.0002 58.7955 20.9474C58.7936 20.8963 58.7716 20.8471 58.7313 20.8106C58.7111 20.7924 58.6873 20.7778 58.6635 20.7686C58.658 20.7686 58.6525 20.7686 58.6488 20.765C58.5773 20.7449 58.4985 20.7614 58.4453 20.8197L58.4435 20.8215Z" fill="#91D7EC" />
                <path id="Vector_1229" d="M57.6126 19.8623C57.5705 19.8623 57.5283 19.8751 57.4935 19.9024C57.4055 19.9717 57.3908 20.0976 57.4605 20.1851C57.5081 20.2453 57.5833 20.269 57.6548 20.2562C57.6878 20.2507 57.719 20.2398 57.7465 20.2179C57.7905 20.1833 57.8161 20.1322 57.8216 20.0811C57.8271 20.0301 57.8143 19.9772 57.7795 19.9353C57.7666 19.9188 57.7501 19.9079 57.7336 19.897C57.697 19.8714 57.6566 19.8605 57.6145 19.8623H57.6126Z" fill="#91D7EC" />
                <path id="Vector_1230" d="M56.755 18.8283C56.733 18.832 56.711 18.8393 56.6908 18.8502C56.5955 18.9068 56.5643 19.0308 56.6212 19.1274C56.678 19.2222 56.8027 19.2532 56.8998 19.1967C56.997 19.1402 57.0263 19.0162 56.9695 18.9195C56.9566 18.8995 56.942 18.8849 56.9236 18.8703C56.876 18.8302 56.8155 18.8156 56.755 18.8283Z" fill="#91D7EC" />
                <path id="Vector_1231" d="M56.1976 18.0734C56.2984 18.026 56.3442 17.9074 56.2966 17.8053C56.2856 17.7798 56.2672 17.7579 56.2471 17.7397C56.1939 17.6922 56.1206 17.6777 56.0509 17.7014C56.0436 17.7032 56.0344 17.7032 56.0271 17.7068C55.9263 17.7542 55.8804 17.8728 55.9281 17.9749C55.9758 18.0752 56.0949 18.1208 56.1976 18.0734Z" fill="#91D7EC" />
                <path id="Vector_1232" d="M55.6419 16.8735C55.7427 16.8261 55.7886 16.7076 55.7409 16.6055C55.6933 16.5052 55.5741 16.4596 55.4714 16.507C55.3706 16.5544 55.3248 16.6729 55.3724 16.775C55.4201 16.8753 55.5393 16.9209 55.6419 16.8735Z" fill="#91D7EC" />
                <path id="Vector_1233" d="M60.0382 22.9624C60.0217 22.9916 60.0162 23.0226 60.0162 23.0536C60.0143 23.1265 60.0492 23.1977 60.1188 23.2359C60.2178 23.2888 60.3407 23.2542 60.3938 23.1557C60.447 23.0572 60.4122 22.9351 60.3132 22.8822C60.2453 22.8457 60.1647 22.853 60.1042 22.8931C60.0785 22.9114 60.0547 22.9314 60.0382 22.9624Z" fill="#91D7EC" />
                <path id="Vector_1234" d="M58.9253 22.5813C59.0133 22.6506 59.1398 22.6378 59.2094 22.5503C59.2791 22.4627 59.2663 22.3369 59.1783 22.2676C59.1159 22.2184 59.0353 22.2129 58.9675 22.2439C58.94 22.2567 58.9143 22.2731 58.8941 22.2986C58.874 22.3223 58.863 22.3497 58.8556 22.3789C58.8373 22.4518 58.8611 22.532 58.9235 22.5831L58.9253 22.5813Z" fill="#91D7EC" />
                <path id="Vector_1235" d="M57.8841 21.4452C57.8016 21.5199 57.7943 21.6476 57.8695 21.7297C57.9446 21.8117 58.0729 21.819 58.1554 21.7442C58.2379 21.6695 58.2453 21.5418 58.1701 21.4598C58.0949 21.3777 57.9666 21.3704 57.8841 21.4452Z" fill="#91D7EC" />
                <path id="Vector_1236" d="M56.9618 20.7267C57.0223 20.816 57.1433 20.8397 57.2349 20.785C57.2368 20.785 57.2404 20.785 57.2423 20.7814C57.3357 20.7194 57.3596 20.5936 57.2972 20.5024C57.2422 20.4203 57.1359 20.3948 57.0479 20.4349C57.0369 20.4404 57.0259 20.4422 57.0149 20.4477C56.9214 20.5097 56.8976 20.6355 56.9599 20.7267H56.9618Z" fill="#91D7EC" />
                <path id="Vector_1237" d="M56.2964 19.339C56.1974 19.39 56.157 19.5122 56.2084 19.6107C56.2597 19.7092 56.3825 19.7493 56.4815 19.6982C56.5237 19.6763 56.553 19.6417 56.5714 19.6016C56.5952 19.5469 56.5989 19.4849 56.5714 19.4265C56.5384 19.3609 56.4724 19.3262 56.4045 19.3207C56.3679 19.3189 56.333 19.3207 56.2982 19.339H56.2964Z" fill="#91D7EC" />
                <path id="Vector_1238" d="M55.5907 18.4181C55.6329 18.522 55.7502 18.5713 55.8547 18.5311C55.8657 18.5275 55.8749 18.5184 55.8841 18.5129C55.9665 18.4618 56.005 18.3615 55.9684 18.2704C55.9262 18.1664 55.8089 18.1172 55.7044 18.1573C55.6879 18.1646 55.6751 18.1755 55.6622 18.1847C55.5907 18.2375 55.5577 18.3324 55.5926 18.4181H55.5907Z" fill="#91D7EC" />
                <path id="Vector_1239" d="M55.0959 17.1762C55.1289 17.282 55.2426 17.3422 55.3489 17.3093C55.4552 17.2765 55.5157 17.1634 55.4827 17.0577C55.4497 16.9519 55.3361 16.8917 55.2298 16.9246C55.1234 16.9574 55.0629 17.0704 55.0959 17.1762Z" fill="#91D7EC" />
                <path id="Vector_1240" d="M54.9544 16.0493C55.0607 16.0164 55.1212 15.9034 55.0882 15.7976C55.0552 15.6918 54.9415 15.6317 54.8352 15.6645C54.7289 15.6973 54.6684 15.8104 54.7014 15.9161C54.7344 16.0219 54.8481 16.0821 54.9544 16.0493Z" fill="#91D7EC" />
                <path id="Vector_1241" d="M57.644 23.6973C57.732 23.628 57.7467 23.5022 57.677 23.4146C57.6074 23.3271 57.4809 23.3125 57.3929 23.3818C57.3049 23.4511 57.2902 23.5769 57.3599 23.6645C57.4295 23.752 57.556 23.7666 57.644 23.6973Z" fill="#91D7EC" />
                <path id="Vector_1242" d="M56.7971 22.6779C56.8924 22.6214 56.9254 22.4974 56.8668 22.4007C56.8099 22.3059 56.6853 22.2731 56.5881 22.3314C56.4928 22.3879 56.4598 22.512 56.5185 22.6086C56.5753 22.7034 56.7 22.7362 56.7971 22.6779Z" fill="#91D7EC" />
                <path id="Vector_1243" d="M56.095 21.5546C56.1977 21.509 56.2417 21.3887 56.1959 21.2884C56.15 21.1881 56.029 21.1425 55.9282 21.1881C55.8274 21.2337 55.7815 21.354 55.8274 21.4543C55.8732 21.5546 55.9942 21.6002 56.095 21.5546Z" fill="#91D7EC" />
                <path id="Vector_1244" d="M55.5286 20.3565C55.6349 20.3201 55.6899 20.2052 55.6533 20.0994C55.6166 19.9936 55.5011 19.9389 55.3948 19.9754C55.2885 20.0119 55.2335 20.1268 55.2701 20.2325C55.3068 20.3383 55.4223 20.393 55.5286 20.3565Z" fill="#91D7EC" />
                <path id="Vector_1245" d="M54.8318 18.9724C54.8611 19.08 54.9711 19.1438 55.0793 19.1147C55.1875 19.0855 55.2516 18.9761 55.2223 18.8685C55.193 18.7609 55.083 18.6971 54.9748 18.7262C54.8666 18.7554 54.8025 18.8648 54.8318 18.9724Z" fill="#91D7EC" />
                <path id="Vector_1246" d="M54.7271 17.8418C54.8371 17.8199 54.9068 17.7124 54.8848 17.6029C54.8628 17.4935 54.7546 17.4242 54.6446 17.4461C54.5346 17.468 54.465 17.5756 54.487 17.685C54.509 17.7944 54.6171 17.8637 54.7271 17.8418Z" fill="#91D7EC" />
                <path id="Vector_1247" d="M54.4359 16.5489C54.4359 16.5489 54.4451 16.5489 54.4488 16.5489C54.5588 16.5307 54.6339 16.4267 54.6156 16.3173C54.5973 16.2079 54.4928 16.1331 54.3828 16.1514C54.3039 16.1641 54.2471 16.2207 54.2233 16.29C54.2141 16.3191 54.2086 16.3501 54.2141 16.383C54.2306 16.4887 54.3278 16.5598 54.4341 16.5489H54.4359Z" fill="#91D7EC" />
                <path id="Vector_1248" d="M54.2341 15.2451C54.3441 15.2268 54.4193 15.1229 54.4009 15.0135C54.3826 14.9041 54.2781 14.8293 54.1681 14.8475C54.0581 14.8658 53.983 14.9697 54.0013 15.0791C54.0196 15.1885 54.1241 15.2633 54.2341 15.2451Z" fill="#91D7EC" />
                <path id="Vector_1249" d="M53.915 23.5131C53.9351 23.6225 54.0396 23.6955 54.1496 23.6754C54.2596 23.6553 54.3329 23.5514 54.3128 23.442C54.2926 23.3326 54.1881 23.2596 54.0781 23.2797C53.9681 23.2997 53.8948 23.4037 53.915 23.5131Z" fill="#91D7EC" />
                <path id="Vector_1250" d="M53.6786 22.2001C53.6914 22.3114 53.7923 22.3898 53.9041 22.377C54.0159 22.3643 54.0948 22.264 54.0819 22.1527C54.0691 22.0415 53.9683 21.9631 53.8564 21.9758C53.7446 21.9886 53.6658 22.0889 53.6786 22.2001Z" fill="#91D7EC" />
                <path id="Vector_1251" d="M53.5229 20.8799C53.5321 20.9911 53.6292 21.0732 53.7411 21.0659C53.8529 21.0568 53.9354 20.9601 53.9281 20.8489C53.9207 20.7376 53.8217 20.6556 53.7099 20.6629C53.5981 20.672 53.5156 20.7686 53.5229 20.8799Z" fill="#91D7EC" />
                <path id="Vector_1252" d="M53.6146 19.3463C53.5028 19.3517 53.4166 19.4466 53.4221 19.5578C53.4276 19.669 53.523 19.7547 53.6348 19.7493C53.7466 19.7438 53.8328 19.649 53.8273 19.5377C53.8218 19.4265 53.7264 19.3408 53.6146 19.3463Z" fill="#91D7EC" />
                <path id="Vector_1253" d="M53.5542 18.0278C53.4424 18.0315 53.3544 18.1245 53.358 18.2357C53.3617 18.3469 53.4552 18.4345 53.567 18.4308C53.6788 18.4272 53.7668 18.3342 53.7632 18.2229C53.7595 18.1117 53.666 18.0242 53.5542 18.0278Z" fill="#91D7EC" />
                <path id="Vector_1254" d="M53.5246 17.1087C53.6365 17.1069 53.7263 17.0139 53.7226 16.9027C53.7208 16.7914 53.6273 16.7021 53.5155 16.7057C53.4037 16.7076 53.3138 16.8006 53.3175 16.9118C53.3193 17.023 53.4128 17.1124 53.5246 17.1087Z" fill="#91D7EC" />
                <path id="Vector_1255" d="M53.292 15.5897C53.292 15.7009 53.3855 15.7903 53.4973 15.7885C53.5817 15.7885 53.6532 15.7356 53.6825 15.6626C53.6917 15.6389 53.6972 15.6116 53.6972 15.5842C53.6972 15.473 53.6037 15.3836 53.4919 15.3855C53.4754 15.3855 53.4607 15.3909 53.4442 15.3964C53.3562 15.4201 53.2902 15.4967 53.292 15.5915V15.5897Z" fill="#91D7EC" />
                <path id="Vector_1256" d="M53.4754 14.4682C53.5872 14.4682 53.677 14.3752 53.6752 14.264C53.6752 14.1527 53.5817 14.0634 53.4699 14.0652C53.358 14.067 53.2682 14.1582 53.27 14.2695C53.27 14.3807 53.3635 14.47 53.4754 14.4682Z" fill="#91D7EC" />
              </g>
              <defs>
                <clipPath id="clip0_226_3390">
                  <rect width="70.0952" height="64" fill="white" />
                </clipPath>
              </defs>
            </svg>

          </div>
          <span class="px-3 whitespace-pre-wrap max-w-full">
            Volkswagen <span style={{ 'font-weight': '700' }}>GoingElectricGPT</span>
          </span>
          <div style={{ flex: 1 }} />
          <DeleteButton
            sendButtonColor={props.bubbleTextColor}
            type="button"
            isDisabled={messages().length === 1}
            class="my-2 ml-2"
            on:click={clearChat}
          >
            <span style={{ 'font-family': 'Poppins, sans-serif' }}>Clear</span>
          </DeleteButton>
        </div>

        <div class="flex flex-col w-full h-full justify-start z-0 mb-[25px]">
          <div
            ref={chatContainer}
            class="overflow-y-scroll flex flex-col flex-grow min-w-full w-full px-[50px] pt-[120px] relative scrollable-container chatbot-chat-view scroll-smooth"
          >
            <For each={[...messages()]}>
              {(message, index) => {
                return (
                  <>
                    {message.type === 'userMessage' && (
                      <GuestBubble
                        message={message}
                        apiHost={props.apiHost}
                        chatflowid={props.chatflowid}
                        chatId={chatId()}
                        backgroundColor={props.userMessage?.backgroundColor}
                        textColor={props.userMessage?.textColor}
                        showAvatar={props.userMessage?.showAvatar}
                        avatarSrc={props.userMessage?.avatarSrc}
                        fontSize={props.fontSize}
                      />
                    )}
                    {message.type === 'apiMessage' && (
                      <BotBubble
                        message={message}
                        fileAnnotations={message.fileAnnotations}
                        chatflowid={props.chatflowid}
                        chatId={chatId()}
                        apiHost={props.apiHost}
                        backgroundColor={props.botMessage?.backgroundColor}
                        textColor={props.botMessage?.textColor}
                        feedbackColor={props.feedback?.color}
                        showAvatar={props.botMessage?.showAvatar}
                        avatarSrc={props.botMessage?.avatarSrc}
                        chatFeedbackStatus={chatFeedbackStatus()}
                        fontSize={props.fontSize}
                        isLoading={loading() && index() === messages().length - 1}
                        showAgentMessages={props.showAgentMessages}
                        handleActionClick={(label, action) => handleActionClick(label, action)}
                        sourceDocsTitle={props.sourceDocsTitle}
                        handleSourceDocumentsClick={(sourceDocuments) => {
                          setSourcePopupSrc(sourceDocuments);
                          setSourcePopupOpen(true);
                        }}
                      />
                    )}
                    {message.type === 'leadCaptureMessage' && leadsConfig()?.status && !getLocalStorageChatflow(props.chatflowid)?.lead && (
                      <LeadCaptureBubble
                        message={message}
                        chatflowid={props.chatflowid}
                        chatId={chatId()}
                        apiHost={props.apiHost}
                        backgroundColor={props.botMessage?.backgroundColor}
                        textColor={props.botMessage?.textColor}
                        fontSize={props.fontSize}
                        showAvatar={props.botMessage?.showAvatar}
                        avatarSrc={props.botMessage?.avatarSrc}
                        leadsConfig={leadsConfig()}
                        sendButtonColor={props.textInput?.sendButtonColor}
                        isLeadSaved={isLeadSaved()}
                        setIsLeadSaved={setIsLeadSaved}
                        setLeadEmail={setLeadEmail}
                      />
                    )}
                    {message.type === 'userMessage' && loading() && index() === messages().length - 1 && <LoadingBubble />}
                    {message.type === 'apiMessage' && message.message === '' && loading() && index() === messages().length - 1 && <LoadingBubble />}
                  </>
                );
              }}
            </For>
          </div>
          <Show when={messages().length === 1}>
            <Show when={starterPrompts().length > 0}>
              <div class="w-full grid grid-cols-4 px-5 py-[10px] gap-2">
                <For each={[...starterPrompts()]}>
                  {(key) => (
                    <StarterPromptBubble
                      prompt={key}
                      onPromptClick={() => promptClick(key)}
                      starterPromptFontSize={botProps.starterPromptFontSize} // Pass it here as a number
                    />
                  )}
                </For>
              </div>
            </Show>
          </Show>
          <Show when={previews().length > 0}>
            <div class="w-full flex items-center justify-start gap-2 px-5 pt-2 border-t border-[#eeeeee]">
              <For each={[...previews()]}>{(item) => <>{previewDisplay(item)}</>}</For>
            </div>
          </Show>
          <div class="w-full px-[50px] pt-2 pb-1 mb-4">
            {isRecording() ? (
              <>
                {recordingNotSupported() ? (
                  <div class="w-full flex items-center justify-between p-4 border border-[#eeeeee]">
                    <div class="w-full flex items-center justify-between gap-3">
                      <span class="text-base">To record audio, use modern browsers like Chrome or Firefox that support audio recording.</span>
                      <button
                        class="py-2 px-4 justify-center flex items-center bg-red-500 text-white rounded-md"
                        type="button"
                        onClick={() => onRecordingCancelled()}
                      >
                        Okay
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    class="h-[58px] flex items-center justify-between chatbot-input border border-[#eeeeee]"
                    data-testid="input"
                    style={{
                      margin: 'auto',
                      'background-color': props.textInput?.backgroundColor ?? defaultBackgroundColor,
                      color: props.textInput?.textColor ?? defaultTextColor,
                    }}
                  >
                    <div class="flex items-center gap-3 px-4 py-2">
                      <span>
                        <CircleDotIcon color="red" />
                      </span>
                      <span>{elapsedTime() || '00:00'}</span>
                      {isLoadingRecording() && <span class="ml-1.5">Sending...</span>}
                    </div>
                    <div class="flex items-center">
                      <CancelButton buttonColor={props.textInput?.sendButtonColor} type="button" class="m-0" on:click={onRecordingCancelled}>
                        <span style={{ 'font-family': 'Poppins, sans-serif' }}>Send</span>
                      </CancelButton>
                      <SendButton
                        sendButtonColor={props.textInput?.sendButtonColor}
                        type="button"
                        isDisabled={loading()}
                        class="m-0"
                        on:click={onRecordingStopped}
                      >
                        <span style={{ 'font-family': 'Poppins, sans-serif' }}>Send</span>
                      </SendButton>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <TextInput
                backgroundColor={props.textInput?.backgroundColor}
                textColor={props.textInput?.textColor}
                placeholder={props.textInput?.placeholder}
                sendButtonColor={props.textInput?.sendButtonColor}
                maxChars={props.textInput?.maxChars}
                maxCharsWarningMessage={props.textInput?.maxCharsWarningMessage}
                autoFocus={props.textInput?.autoFocus}
                fontSize={props.fontSize}
                disabled={getInputDisabled()}
                defaultValue={userInput()}
                onSubmit={handleSubmit}
                uploadsConfig={uploadsConfig()}
                setPreviews={setPreviews}
                onMicrophoneClicked={onMicrophoneClicked}
                handleFileChange={handleFileChange}
                sendMessageSound={props.textInput?.sendMessageSound}
                sendSoundLocation={props.textInput?.sendSoundLocation}
              />
            )}
          </div>
        </div>
      </div>
      {sourcePopupOpen() && <Popup isOpen={sourcePopupOpen()} value={sourcePopupSrc()} onClose={() => setSourcePopupOpen(false)} />}

      {disclaimerPopupOpen() && (
        <DisclaimerPopup
          isOpen={disclaimerPopupOpen()}
          onAccept={handleDisclaimerAccept}
          title={props.disclaimer?.title}
          message={props.disclaimer?.message}
          buttonText={props.disclaimer?.buttonText}
        />
      )}
    </>
  );
};
