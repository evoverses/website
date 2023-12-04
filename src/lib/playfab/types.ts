export namespace PlayFab {

  export type ResponseBase = {
    code: number;
    status: string;
  };
  export type EntityKey = {
    Id: string;
    Type: string;
  };
  export namespace Client {

    export namespace Account {
      export type TitleActivationStatus =
        "ActivatedSteam"
        | "ActivatedTitleKey"
        | "None"
        | "PendingSteam"
        | "RevokedSteam";

      export type LoginIdentityProvider = "Amazon"
        | "Android"
        | "Apple"
        | "CustomId"
        | "Facebook"
        | "FacebookInstantGamesId"
        | "GameCenter"
        | "GamersFirst"
        | "Google"
        | "GooglePlayGames"
        | "IOS"
        | "Kongregate"
        | "LoadTest"
        | "NintendoSwitchAccount"
        | "NintendoSwitchDeviceId"
        | "OpenIdConnect"
        | "Organic"
        | "PSN"
        | "Parse"
        | "ServerCustomId"
        | "Steam"
        | "Twitch"
        | "Unknown"
        | "XboxLive";

      export type PushNotificationPlatform = "ApplePushNotificationService" | "GoogleCloudMessaging";

      export type ItemInstance = {
        Annotation: string;
        BundleContents: any[];
        BundleParent: string;
        CatalogVersion: string;
        CustomData: any;
        DisplayName: string;
        Expiration: string;
        ItemClass: string;
        ItemId: string;
        ItemInstanceId: string;
        PurchaseDate: string;
        RemainingUses: number;
        UnitCurrency: string;
        UnitPrice: number;
        UsesIncrementedBy: number;
      }
      export type AccountInfo = {
        PlayFabId: string;
        Created: string;
        Username: string;
        TitleInfo: {
          AvatarUrl: string;
          Created: string;
          DisplayName: string;
          FirstLogin: string;
          LastLogin: string;
          Origination: LoginIdentityProvider;
          TitlePlayerAccount: EntityKey
          isBanned: boolean;
        };
        AndroidDeviceInfo?: {
          AndroidDeviceId: string;
        };
        AppleAccountInfo?: {
          AppleSubjectId: string;
        };
        CustomIdInfo?: {
          CustomId: string;
        };
        FacebookInfo?: {
          FacebookId: string;
          FullName: string;
        };
        FacebookInstantGamesIdInfo?: {
          FacebookInstantGamesId: string;
        };

        GameCenterInfo?: {
          GameCenterId: string;
        };

        GoogleInfo?: {
          GoogleId: string;
          GoogleEmail: string;
          GoogleLocale: string;
          GoogleGender: string;
          GoogleName: string;
        };

        GooglePlayGamesInfo?: {
          GooglePlayGamesPlayerAvatarImageUrl: string;
          GooglePlayGamesPlayerDisplayName: string;
          GooglePlayGamesPlayerId: string;
        }

        IosDeviceInfo?: {
          IosDeviceId: string;
        };

        KongregateInfo?: {
          KongregateId: string;
          KongregateName: string;
        };

        NintendoSwitchAccountInfo?: {
          NintendoSwitchAccountSubjectId: string;
        };

        NintendoSwitchDeviceIdInfo?: {
          NintendoSwitchDeviceId: string;
        };

        OpenIdInfo?: {
          ConnectionId: string;
          Issuer: string;
          Subject: string;
        };

        PrivateInfo?: {
          Email: string;
        };

        PSNInfo?: {
          PSNAccountId: string;
          PSNOnlineId: string;
        };

        ServerCustomIdInfo?: {
          CustomId: string;
        };

        SteamInfo?: {
          SteamName: string;
          SteamId: string;
          SteamCountry: string;
          SteamCurrency: string;
          SteamActivationStatus: TitleActivationStatus;
        };

        TwitchInfo?: {
          TwitchId: string;
          TwitchUserName: string;
        }

        XboxInfo?: {
          XboxUserId: string;
          XboxUserSandbox: string;
        };
      };

      export type CharacterInventory = {
        CharacterId: string;
        Inventory: ItemInstance[];
      };

      export type Character = {
        CharacterId: string;
        CharacterName: string;
        CharacterType: string;
      }

      export type PlayerProfile = {
        AdCampaignAttributions: {
          AttributedAt: string;
          CampaignId: string;
          Platform: string;
        }[];
        AvatarUrl: string;
        BannedUntil: string;
        ContactEmailAddresses: {
          EmailAddress: string;
          Name: string;
          VerificationStatus: "Confirmed" | "Pending" | "Unverified";
        }[];
        Created: string;
        DisplayName: string;
        ExperimentVariants: any[];
        LastLogin: string;
        LinkedAccounts: {
          Email: string;
          Platform: LoginIdentityProvider;
          PlatformUserId: string;
          Username: string;
        }[];
        Locations: {
          City: string;
          ContinentCode: string;
          CountryCode: string;
          Latitude: number;
          Longitude: number;
        }[];
        Memberships: {
          IsActive: boolean;
          MembershipExpiration: string;
          MembershipId: string;
          MembershipName: string;
          OverrideExpiration: string;
          OverrideIsSet: boolean;
          Subscriptions: {
            Expiration: string;
            InitialSubscriptionTime: string;
            IsActive: boolean;
            Status: "BillingError" | "Cancelled" | "CustomerDidNotAcceptPriceChange" | "FreeTrial" | "NoError" | "PaymentPending" | "ProductUnavailable" | "UnknownError";
            SubscriptionId: string;
            SubscriptionItemId: string;
            SubscriptionProvider: string;
          }[];
        }[];
        Origination: LoginIdentityProvider;
        PlayerId: string;
        PublisherId: string;
        PushNotificationRegistrations: {
          NotificationEndpointARN: string;
          Platform: PushNotificationPlatform;
        }[];
        Statistics: {
          Name: string;
          Value: number;
          Version: number;
        }[];
        Tags: {
          TagValue: string
        }[];
        TitleId: string;
        TotalValueToDateInUSD: number;
        ValuesToDate: {
          Currency: string;
          TotalValue: number;
          TotalValueAsDecimal: number;
        }[];
      }
      export type UserDataRecord = {
        LastUpdated: string;
        Permission: "Private" | "Public";
        Value: string;
      }

      export namespace Responses {
        export type AccountInfoResponse = ResponseBase & {
          data: {
            AccountInfo: AccountInfo;
          }
        }
        export type CombinedInfoResponse = ResponseBase & {
          data: {
            InfoResultPayload: {
              AccountInfo: AccountInfo;
              CharacterInventories: CharacterInventory[];
              CharacterList: Character[];
              PlayerProfile: PlayerProfile;
              PlayerStatistics: {
                StatisticName: string;
                Value: number;
                Version: number;
              }[];
              TitleData: Record<string, string>;
              UserData: UserDataRecord;
              UserDataVersion: number;
              UserInventory: ItemInstance[];
              UserReadOnlyData: UserDataRecord;
              UserReadOnlyDataVersion: number;
              UserVirtualCurrency: Record<string, number>;
              UserVirtualCurrencyRechargeTimes: {
                RechargeMax: number;
                RechargeTime: string;
                SecondsToRecharge: number;
              };
            }
            PlayFabId: string;
          }
        }
      }
    }
    export namespace Auth {

      export type LoginResponse = ResponseBase & {
        data: {
          SessionTicket: string;
          PlayFabId: string;
          NewlyCreated: boolean;
          SettingsForUser: {
            NeedsAttribution: boolean;
            GatherDeviceInfo: boolean;
            GatherFocusInfo: boolean;
          },
          LastLoginTime: string;
          EntityToken: {
            EntityToken: string;
            TokenExpiration: string;
            Entity: {
              Id: string;
              Type: string;
              TypeString: string;
            }
          };
          TreatmentAssignment: {
            Variants: any[];
            Variables: any[];
          }
        };
      };
    }
  }
}
