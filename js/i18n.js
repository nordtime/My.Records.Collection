(function () {
    'use strict';

    const STORAGE_KEY = 'rc-language';
    const DEFAULT_LANGUAGE = 'en';
    const SUPPORTED_LANGUAGES = ['en', 'he'];

    const messages = {
        en: {},
        he: {
            'language.switchTo': 'English',
            'language.switchLabel': 'Switch language to English',
            'app.title': 'אוסף התקליטים שלי',
            'app.description': 'ניהול אוסף המוזיקה האישי שלך',
            'common.close': 'סגירה',
            'common.cancel': 'ביטול',
            'common.save': 'שמירה',
            'common.delete': 'מחיקה',
            'common.edit': 'עריכה',
            'common.add': 'הוספה',
            'common.clear': 'ניקוי',
            'common.loading': 'טוען…',
            'common.unknown': 'לא ידוע',
            'common.notSpecified': 'לא צוין',
            'common.none': 'אין',
            'common.search': 'חיפוש',
            'common.help': 'עזרה',
            'common.disclaimer': 'כתב ויתור',
            'common.settings': 'הגדרות',
            'common.refresh': 'רענון',
            'common.back': 'חזרה',
            'common.today': 'היום',
            'common.yesterday': 'אתמול',
            'common.never': 'מעולם לא',
            'common.recently': 'לאחרונה',
            'nav.stats': 'סטטיסטיקה',
            'nav.skipRecords': 'דילוג לתקליטים',
            'nav.history': 'היסטוריה',
            'nav.wishlist': 'רשימת משאלות',
            'nav.account': 'חשבון',
            'nav.signOut': 'יציאה',
            'search.placeholder': 'חיפוש לפי אמן, אלבום או הערות…',
            'search.scope': 'תחום החיפוש',
            'search.allFields': 'כל השדות',
            'search.artistOnly': 'אמן בלבד',
            'search.albumOnly': 'אלבום בלבד',
            'search.notesOnly': 'הערות בלבד',
            'filter.allGenres': 'כל הסגנונות',
            'filter.allYears': 'כל השנים',
            'filter.allFormats': 'כל הפורמטים',
            'filter.advanced': 'מסננים',
            'filter.advancedTitle': 'מסננים מתקדמים',
            'filter.setDefault': 'שמירת ברירת מחדל',
            'filter.setDefaultTitle': 'שמירת המסננים והמיון הנוכחיים כברירת מחדל',
            'filter.dateAdded': 'תאריך הוספה:',
            'filter.from': 'מתאריך',
            'filter.to': 'עד',
            'filter.condition': 'מצב:',
            'filter.allConditions': 'כל המצבים',
            'filter.hasCover': 'כולל תמונת עטיפה',
            'filter.clearAll': 'ניקוי הכל',
            'sort.artist': 'אמן ↑',
            'sort.dateAdded': 'תאריך הוספה ↓',
            'sort.album': 'אלבום ↑',
            'sort.year': 'שנה ↓',
            'sort.genre': 'סגנון ↑',
            'action.surprise': 'הפתע אותי',
            'action.surpriseTitle': 'בחירת תקליט אקראי להשמעה',
            'action.data': 'נתונים',
            'action.dataTitle': 'ייבוא, ייצוא וגיבוי',
            'action.exportCsv': 'ייצוא CSV',
            'action.importCsv': 'ייבוא CSV',
            'action.backup': 'גיבוי (JSON)',
            'action.restore': 'שחזור (JSON)',
            'action.addRecord': 'הוספת תקליט',
            'view.summary': 'סיכום האוסף',
            'view.mode': 'מצב תצוגה',
            'view.grid': 'רשת',
            'view.gridTitle': 'תצוגת רשת',
            'view.list': 'רשימה',
            'view.listTitle': 'תצוגת רשימה',
            'empty.title': 'עדיין אין תקליטים',
            'empty.description': 'אפשר להתחיל לבנות את האוסף על ידי הוספת התקליט הראשון.',
            'empty.action': 'הוספת התקליט הראשון',
            'record.addTitle': 'הוספת תקליט',
            'record.editTitle': 'עריכת תקליט',
            'record.artist': 'אמן',
            'record.album': 'אלבום',
            'record.year': 'שנה',
            'record.genre': 'סגנון',
            'record.format': 'פורמט',
            'record.condition': 'מצב',
            'record.coverUrl': 'כתובת תמונת עטיפה',
            'record.notes': 'הערות',
            'record.tags': 'תגיות / מדפים',
            'record.lookup': 'חיפוש מידע',
            'record.lookupAuto': 'אוטומטי (כל המקורות)',
            'record.genrePlaceholder': 'לדוגמה: רוק, ג׳אז, אלקטרוני…',
            'record.notesPlaceholder': 'מהדורה ראשונה, עותק חתום…',
            'record.tagsPlaceholder': 'מועדפים, למכירה, 45rpm (מופרד בפסיקים)',
            'record.selectCondition': '— בחירה —',
            'format.vinyl': 'תקליט ויניל',
            'format.cd': 'תקליטור',
            'format.cassette': 'קלטת',
            'format.digital': 'דיגיטלי',
            'condition.mint': 'חדש (M)',
            'condition.nearMint': 'כמעט חדש (NM)',
            'condition.veryGoodPlus': 'טוב מאוד פלוס (VG+)',
            'condition.veryGood': 'טוב מאוד (VG)',
            'condition.good': 'טוב (G)',
            'condition.fair': 'סביר (F)',
            'condition.poor': 'גרוע (P)',
            'record.save': 'שמירת תקליט',
            'record.count.one': 'תקליט אחד',
            'record.count.other': '{count} תקליטים',
            'record.select': 'בחירה לפעולות מרובות',
            'record.rating': 'הדירוג שלך',
            'record.timesPlayed': 'מספר השמעות',
            'record.discogsValue': 'שווי ב-Discogs',
            'record.manageTags': 'הוספה או הסרה של תגיות',
            'record.findSpotify': 'חיפוש ב-Spotify',
            'record.markPlayed': 'סימון כהושמע',
            'record.markedPlayed': 'סומן כהושמע',
            'record.playFailed': 'לא ניתן לתעד את ההשמעה',
            'record.updated': 'התקליט עודכן',
            'record.added': 'התקליט נוסף',
            'record.duplicateConfirm': '„{artist} — {album}” ({format}) כבר קיים. להוסיף בכל זאת?',
            'record.duplicateConfirmGeneric': 'כבר קיים תקליט עם אותו אמן, אלבום ופורמט. להוסיף בכל זאת?',
            'record.deleted': 'התקליט נמחק',
            'detail.removeTag': 'הסרת תגית',
            'detail.removeTagLabel': 'הסרת התגית {tag}',
            'record.noRandom': 'אין תקליטים לבחירה',
            'wishlist.purchaseConfirm': 'האם לסמן את „{album}” כנרכש ולהוסיף אותו לאוסף?',
            'wishlist.deleteConfirm': 'האם למחוק את „{album}” מרשימת המשאלות?',
            'record.defaultSaved': 'תצוגת ברירת המחדל נשמרה',
            'admin.deleteUserConfirm': 'האם למחוק את המשתמש „{username}” ואת כל הנתונים שלו לצמיתות? לא ניתן לבטל פעולה זו.',
            'admin.roleChangeConfirm': 'האם לשנות את תפקיד המשתמש ל{role}?',
            'tag.assign': 'שיוך תגיות',
            'tag.new': 'תגית חדשה…',
            'tag.clearFilter': 'ניקוי מסנן התגיות',
            'tag.updateFailed': 'לא ניתן לעדכן את התגיות',
            'tag.networkFailed': 'שגיאת רשת בעת שמירת התגיות',
            'lookup.enterFirst': 'יש להזין תחילה שם אמן ו/או אלבום.',
            'lookup.allSources': 'כל המקורות',
            'lookup.searching': 'מחפש ב{source}…',
            'lookup.none': 'לא נמצאו תוצאות באף מקור.',
            'lookup.results.one': 'תוצאה אחת מ{source} — לחיצה תמלא את הטופס',
            'lookup.results.other': '{count} תוצאות מ{source} — לחיצה תמלא את הטופס',
            'lookup.filled': 'השדות מולאו ✓',
            'lookup.filledFrom': 'פרטי התקליט מולאו מתוך {source}',
            'lookup.failed': 'החיפוש נכשל.',
            'track.title': 'רשימת רצועות',
            'track.loading': 'טוען רצועות…',
            'track.lookingUp': 'מחפש רצועות…',
            'track.none': 'לא נמצא מידע על רצועות למהדורה זו.',
            'track.failed': 'טעינת רשימת הרצועות נכשלה.',
            'track.count.one': 'רצועה אחת',
            'track.count.other': '{count} רצועות',
            'track.name': 'שם',
            'track.duration': 'משך',
            'track.lyrics': 'מילים',
            'track.disc': 'דיסק {number}',
            'lyrics.view': 'הצגת מילים',
            'lyrics.loading': 'טוען מילים…',
            'lyrics.failed': 'טעינת המילים נכשלה.',
            'lyrics.noneSaved': 'עדיין לא נשמרו מילים.',
            'lyrics.fetch': 'חיפוש באינטרנט',
            'lyrics.searching': 'מחפש…',
            'lyrics.found': 'נמצאו מילים דרך {source} ✓',
            'lyrics.noneOnline': 'לא נמצאו מילים לשיר זה באינטרנט.',
            'lyrics.fetchFailed': 'חיפוש המילים באינטרנט נכשל.',
            'stats.title': 'סטטיסטיקות האוסף',
            'stats.loading': 'טוען סטטיסטיקות…',
            'stats.totalRecords': 'סך התקליטים',
            'stats.genres': 'סגנונות',
            'stats.formats': 'פורמטים',
            'stats.byGenre': 'לפי סגנון',
            'stats.byFormat': 'לפי פורמט',
            'stats.byDecade': 'לפי עשור',
            'stats.latest': 'נוספו לאחרונה',
            'stats.collectionValue': 'שווי האוסף (Discogs)',
            'stats.estimatedValue': 'שווי משוער של האוסף',
            'stats.averageRecord': 'ממוצע לתקליט',
            'stats.recordsPriced': 'תקליטים עם מחיר',
            'stats.valueHint': 'יש ללחוץ על כפתור <strong>שווי</strong> בתקליט כדי לקבל מחיר מ-Discogs.',
            'stats.failed': 'טעינת הסטטיסטיקות נכשלה.',
            'value.title': 'שווי ב-Discogs',
            'value.loading': 'בודק שווי…',
            'selection.count.one': 'פריט אחד נבחר',
            'selection.count.other': '{count} פריטים נבחרו',
            'selection.delete': 'מחיקת הנבחרים',
            'selection.bulkName.one': 'תקליט נבחר אחד',
            'selection.bulkName.other': '{count} תקליטים נבחרים',
            'selection.deleted.one': 'תקליט אחד נמחק.',
            'selection.deleted.other': '{count} תקליטים נמחקו.',
            'selection.partial': '{deleted} מתוך {total} נמחקו (חלק מהפעולות נכשלו).',
            'delete.title': 'מחיקת תקליט',
            'delete.confirm': 'האם למחוק את {name}? לא ניתן לבטל פעולה זו.',
            'import.title': 'ייבוא מ-CSV',
            'import.description': 'יש להעלות קובץ CSV עם העמודות:',
            'import.headerHint': 'השורה הראשונה צריכה להיות שורת הכותרות.',
            'import.downloadTemplate': 'הורדת תבנית',
            'import.drop': 'גרירת קובץ CSV לכאן או לחיצה לבחירה',
            'import.preview': 'תצוגה מקדימה',
            'import.records': 'ייבוא תקליטים',
            'import.dropCsv': 'יש לגרור קובץ ‎.csv.',
            'import.empty': 'קובץ ה-CSV ריק או שאינו מכיל שורות נתונים.',
            'import.previewCount': 'תצוגה מקדימה — נמצאו {count} תקליטים',
            'import.previewLimited': ' (מוצגים {limit} הראשונים)',
            'import.actionCount': 'ייבוא {count} תקליטים',
            'import.importing': 'מייבא…',
            'import.success': 'יובאו {imported} מתוך {total} תקליטים',
            'import.none': 'לא יובאו תקליטים.',
            'import.failed': 'הייבוא נכשל: {message}',
            'export.empty': 'אין תקליטים לייצוא.',
            'export.success': 'יוצאו {count} תקליטים ל-CSV.',
            'value.refreshing': 'מרענן את נתוני השווי…',
            'value.lookingUpMarket': 'בודק שווי בשוק…',
            'value.estimated': 'שווי משוער',
            'value.market': 'מחיר שוק',
            'value.lowest': 'הנמוך ביותר',
            'value.median': 'חציון',
            'value.highest': 'הגבוה ביותר',
            'value.forSale': 'למכירה:',
            'value.listings': '{count} מודעות',
            'value.label': 'חברת תקליטים:',
            'value.catalog': 'מספר קטלוגי:',
            'value.country': 'מדינה:',
            'value.format': 'פורמט:',
            'value.viewDiscogs': 'צפייה ב-Discogs',
            'value.refresh': 'רענון',
            'value.refreshTitle': 'משיכת נתונים מחדש מ-Discogs',
            'value.none': 'אין נתוני מחיר זמינים בשוק למהדורה זו.',
            'value.failed': 'משיכת הנתונים מ-Discogs נכשלה.',
            'detail.close': 'סגירת פרטי התקליט',
            'detail.cover': 'עטיפת האלבום',
            'detail.zoom': 'הגדלת העטיפה',
            'detail.notRated': 'לא דורג',
            'detail.information': 'מידע',
            'detail.tracks': 'רצועות',
            'detail.history': 'היסטוריה',
            'detail.related': 'קשורים',
            'detail.dateAdded': 'תאריך הוספה',
            'detail.purchaseInfo': 'פרטי רכישה',
            'detail.playCount': 'מספר השמעות',
            'detail.addTag': 'הוספת תגית…',
            'detail.viewDiscogs': 'צפייה ב-Discogs',
            'detail.viewMusicBrainz': 'צפייה ב-MusicBrainz',
            'detail.noNotes': 'אין הערות',
            'detail.noPurchaseInfo': 'אין פרטי רכישה',
            'detail.notValued': 'ללא הערכת שווי',
            'detail.stars.one': 'כוכב אחד',
            'detail.stars.other': '{count} כוכבים',
            'detail.noTags': 'עדיין אין תגיות',
            'detail.historyLoading': 'טוען היסטוריה…',
            'detail.historyHint': 'לחיצה על „סימון כהושמע” תתחיל את המעקב',
            'detail.relatedLoading': 'טוען תקליטים קשורים…',
            'detail.playedSuccess': 'סומן כהושמע',
            'dashboard.records': 'תקליטים',
            'dashboard.estimatedValue': 'שווי משוער',
            'dashboard.priced': '{count} עם מחיר',
            'dashboard.runValuations': 'יש לבצע הערכת שווי',
            'dashboard.totalPlays': 'סך ההשמעות',
            'dashboard.topGenre': 'הסגנון המוביל',
            'analytics.title': 'ניתוח האוסף',
            'analytics.formatDistribution': 'התפלגות פורמטים',
            'analytics.topGenres': '10 הסגנונות המובילים',
            'analytics.timeline': 'ציר זמן של רכישות',
            'analytics.topArtists': '15 האמנים המובילים',
            'analytics.totalValue': 'השווי הכולל ב-Discogs',
            'analytics.mostValuable': 'היקר ביותר',
            'analytics.averageMonth': 'ממוצע לחודש',
            'analytics.averageRating': 'דירוג ממוצע',
            'analytics.mostPlayed': 'המושמע ביותר',
            'analytics.latestAddition': 'התוספת האחרונה',
            'analytics.topValuable': '10 התקליטים היקרים ביותר',
            'wishlist.title': 'רשימת משאלות',
            'wishlist.add': 'הוספה לרשימת המשאלות',
            'wishlist.addTitle': 'הוספה לרשימת המשאלות',
            'wishlist.editTitle': 'עריכת פריט ברשימת המשאלות',
            'wishlist.items.one': 'פריט אחד',
            'wishlist.items.other': '{count} פריטים',
            'wishlist.total': 'סה״כ {amount}',
            'wishlist.targetPrice': 'מחיר יעד ($)',
            'wishlist.discogsUrl': 'כתובת Discogs',
            'wishlist.save': 'שמירה ברשימת המשאלות',
            'wishlist.emptyTitle': 'רשימת המשאלות ריקה',
            'wishlist.emptyText': 'אפשר להוסיף תקליטים שברצונך לקנות כדי לעקוב אחר מחירים וזמינות',
            'wishlist.addFirst': 'הוספת הפריט הראשון',
            'wishlist.target': 'יעד:',
            'wishlist.added': 'נוסף {date}',
            'wishlist.markPurchased': 'סימון כנרכש',
            'wishlist.viewDiscogs': 'צפייה ב-Discogs',
            'wishlist.required': 'חובה להזין אמן ואלבום',
            'wishlist.updated': 'הפריט ברשימת המשאלות עודכן',
            'wishlist.addedSuccess': 'נוסף לרשימת המשאלות',
            'wishlist.moved': 'הועבר לאוסף',
            'wishlist.saveFailed': 'שמירת הפריט ברשימת המשאלות נכשלה',
            'wishlist.purchaseFailed': 'לא ניתן לסמן כנרכש',
            'wishlist.removed': 'הוסר מרשימת המשאלות',
            'wishlist.deleteFailed': 'מחיקת הפריט מרשימת המשאלות נכשלה',
            'sessions.title': 'היסטוריית האזנה',
            'sessions.totalPlays': 'סך ההשמעות',
            'sessions.dayStreak': 'רצף ימים',
            'sessions.mostPlayed': 'המושמע ביותר',
            'sessions.lastPlayed': 'הושמע לאחרונה',
            'sessions.allTime': 'כל התקופות',
            'sessions.week': 'השבוע',
            'sessions.month': 'החודש',
            'sessions.year': 'השנה',
            'sessions.emptyTitle': 'עדיין אין היסטוריית האזנה',
            'sessions.emptyText': 'אפשר להתחיל לעקוב באמצעות „סימון כהושמע” בכל תקליט',
            'sessions.plays.one': 'השמעה אחת',
            'sessions.plays.other': '{count} השמעות',
            'sessions.loadFailed': 'טעינת היסטוריית ההאזנה נכשלה',
            'admin.title': 'ניהול משתמשים',
            'admin.openRegistration': 'הרשמה עצמית פתוחה (הרשמות חדשות פעילות מיד)',
            'admin.registrationHint': 'כשהאפשרות כבויה, חשבונות חדשים ממתינים עד לאישור כאן.',
            'admin.searchUsers': 'חיפוש משתמשים',
            'admin.allUsers': 'כל המשתמשים',
            'admin.pending': 'ממתינים לאישור',
            'admin.unverified': 'דוא״ל לא מאומת',
            'admin.active': 'פעילים',
            'admin.disabled': 'מושבתים',
            'admin.administrators': 'מנהלים',
            'admin.user': 'משתמש',
            'admin.role': 'תפקיד',
            'admin.status': 'מצב',
            'admin.records': 'תקליטים',
            'admin.lastLogin': 'כניסה אחרונה',
            'admin.actions': 'פעולות',
            'admin.loadFailed': 'טעינת המשתמשים נכשלה.',
            'admin.noMatches': 'אין משתמשים התואמים לתצוגה זו.',
            'admin.approve': 'אישור',
            'admin.resend': 'שליחת אימות',
            'admin.disable': 'השבתה',
            'admin.enable': 'הפעלה',
            'admin.delete': 'מחיקה',
            'admin.total': 'סה״כ',
            'admin.userRole': 'משתמש',
            'admin.you': 'אתה',
            'admin.verified': 'מאומת',
            'admin.emailVerified': 'הדוא״ל אומת',
            'admin.emailNotVerified': 'הדוא״ל לא אומת',
            'admin.makeRole': 'הפיכה ל{role}',
            'admin.registrationUpdated': 'הגדרת ההרשמה עודכנה',
            'admin.actionFailed': 'הפעולה נכשלה',
            'admin.working': 'מעבד…',
            'admin.updated': 'המשתמש עודכן',
            'admin.verificationSent': 'הודעת האימות נשלחה',
            'footer.openSource': 'קוד פתוח (MIT)',
            'auth.signIn': 'כניסה',
            'auth.createAccount': 'יצירת חשבון',
            'auth.authentication': 'אימות',
            'auth.usernameOrEmail': 'שם משתמש או דוא״ל',
            'auth.password': 'סיסמה',
            'auth.staySignedIn': 'להישאר מחובר במכשיר זה',
            'auth.forgotPassword': 'שכחת את הסיסמה?',
            'auth.resendVerification': 'שליחת הודעת אימות מחדש',
            'auth.email': 'דוא״ל',
            'auth.verification': 'אימות:',
            'auth.newQuestion': 'קבלת שאלת אימות חדשה',
            'auth.sendReset': 'שליחת קישור לאיפוס',
            'auth.backToSignIn': 'חזרה לכניסה',
            'auth.username': 'שם משתמש',
            'auth.newPassword': 'סיסמה חדשה',
            'auth.confirmPassword': 'אימות סיסמה',
            'auth.passwordHint': 'לפחות 8 תווים, כולל אות ומספר.',
            'auth.usernameHint': '3–50 תווים: אותיות, מספרים, נקודה, קו תחתון ומקף.',
            'auth.captchaHint': 'יש לענות על שאלת החשבון הפשוטה כדי לאמת שאינך רובוט.',
            'auth.resetIntro': 'יש להזין את כתובת הדוא״ל של החשבון ונשלח קישור לאיפוס הסיסמה.',
            'auth.skip': 'דילוג לטופס הכניסה',
            'auth.disclaimerTitle': 'כתב ויתור בנושא נתונים ושימוש',
            'auth.agreePrefix': 'יצירת חשבון מהווה הסכמה ל',
            'auth.dataDisclaimer': 'כתב הוויתור בנושא נתונים ושימוש',
            'auth.openSource': 'קוד פתוח (MIT) · הנתונים מוקדשים תחת CC0 1.0',
            'auth.unavailable': 'לא זמין',
            'auth.requestFailed': 'הבקשה נכשלה.',
            'auth.networkError': 'שגיאת רשת. יש לנסות שוב.',
            'auth.resendHint': 'אפשר לשלוח את הקישור מחדש למטה.',
            'auth.signInFailed': 'הכניסה נכשלה.',
            'auth.passwordMismatch': 'הסיסמאות אינן תואמות.',
            'auth.accountCreated': 'החשבון נוצר. יש לבדוק את הדוא״ל ולאמת את החשבון.',
            'auth.createFailed': 'לא ניתן ליצור את החשבון.',
            'auth.firstAdmin': 'עדיין אין חשבון — החשבון הראשון שייווצר יהיה חשבון מנהל.',
            'auth.disclaimerUnavailable': 'כתב הוויתור אינו זמין.',
            'account.admin': 'מנהל',
            'account.userManagement': 'ניהול משתמשים',
            'account.help': 'עזרה ומדריך שימוש',
            'account.delete': 'מחיקת החשבון שלי',
            'account.deleteTitle': 'מחיקת החשבון שלי',
            'account.deleteWarning': 'פעולה זו תמחק לצמיתות את החשבון ואת <strong>כל</strong> התקליטים, ההשמעות ורשימת המשאלות שלך. לא ניתן לבטל אותה.',
            'account.backupFirst': 'מומלץ להשתמש קודם באפשרות <strong>נתונים ← גיבוי</strong>.',
            'account.confirmPassword': 'אימות הסיסמה',
            'account.deleteForever': 'מחיקה לצמיתות',
            'account.deleteFailed': 'לא ניתן למחוק את החשבון.',
            'settings.discogsToken': 'אסימון API של Discogs',
            'settings.discogsHelp': 'האסימון האישי משמש לחיפוש שווי השוק של התקליטים. הוא נשמר בחשבון שלך בלבד. <a href="https://www.discogs.com/settings/developers" target="_blank" rel="noopener">איך לקבל אסימון Discogs ←</a>',
            'settings.discogsStep1': 'יש להיכנס ל-Discogs ולפתוח <strong>Settings ← Developers</strong>.',
            'settings.discogsStep2': 'יש ללחוץ על <strong>Generate new token</strong> באזור האסימון האישי.',
            'settings.discogsStep3': 'יש להעתיק את האסימון ולהדביק אותו למטה.',
            'settings.personalToken': 'אסימון גישה אישי',
            'settings.tokenPlaceholder': 'הדבקת אסימון Discogs',
            'settings.clearToken': 'מחיקת האסימון',
            'settings.saveToken': 'שמירת האסימון',
            'settings.changePassword': 'שינוי סיסמה',
            'settings.currentPassword': 'סיסמה נוכחית',
            'settings.confirmNewPassword': 'אימות הסיסמה החדשה',
            'settings.changeEmail': 'שינוי כתובת דוא״ל',
            'settings.newEmail': 'כתובת דוא״ל חדשה',
            'settings.emailHint': 'נשלח קישור לכתובת החדשה. הכתובת הנוכחית תישאר פעילה עד לאישור.',
            'settings.updateEmail': 'עדכון כתובת הדוא״ל',
            'settings.currentEmail': 'דוא״ל נוכחי: {email}',
            'settings.passwordMismatch': 'הסיסמאות החדשות אינן תואמות.',
            'settings.passwordChanged': 'הסיסמה שונתה.',
            'settings.passwordFailed': 'לא ניתן לשנות את הסיסמה.',
            'settings.checkInbox': 'יש לבדוק את תיבת הדואר החדשה ולאשר.',
            'settings.emailFailed': 'לא ניתן לעדכן את כתובת הדוא״ל.',
            'settings.noToken': 'עדיין לא נשמר אסימון.',
            'settings.tokenFailed': 'לא ניתן לשמור את האסימון.',
            'cookie.notice': 'אתר זה משתמש בעוגייה חיונית כדי לשמור על החיבור לחשבון.',
            'cookie.accept': 'הבנתי',
            'theme.title': 'ערכת נושא',
            'theme.system': 'מערכת',
            'theme.light': 'בהיר',
            'theme.dark': 'כהה',
            'backup.downloaded': 'הגיבוי הורד',
            'backup.failed': 'הגיבוי נכשל',
            'backup.invalidJson': 'קובץ JSON אינו תקין',
            'backup.invalidFile': 'זה אינו קובץ גיבוי תקין',
            'backup.restoreConfirm': 'לשחזר {count} תקליטים מגיבוי זה? כפילויות קיימות ידולגו.',
            'backup.imported': 'יובאו {imported} תקליטים ({skipped} דולגו)',
            'shortcuts.title': 'קיצורי מקלדת',
            'shortcuts.global': 'קיצורים כלליים',
            'shortcuts.focusSearch': 'מעבר לחיפוש',
            'shortcuts.addRecord': 'הוספת תקליט',
            'shortcuts.openStats': 'פתיחת סטטיסטיקה',
            'shortcuts.exportCsv': 'ייצוא ל-CSV',
            'shortcuts.importCsv': 'ייבוא מ-CSV',
            'shortcuts.showHelp': 'הצגת עזרה זו',
            'shortcuts.closeModals': 'סגירת חלונות',
            'shortcuts.grid': 'ניווט ברשת',
            'shortcuts.navigate': 'ניווט בין כרטיסים',
            'shortcuts.openCard': 'פתיחת הכרטיס המסומן',
            'shortcuts.toggleCard': 'בחירה או ביטול בחירה בכרטיס',
            'shortcuts.deleteCard': 'מחיקת הנבחרים או הכרטיס המסומן',
            'shortcuts.selection': 'בחירה',
            'shortcuts.selectAll': 'בחירת כל התקליטים',
            'shortcuts.deselectAll': 'ביטול כל הבחירות',
            'shortcuts.tip': '<strong>טיפ:</strong> רוב הקיצורים פועלים כשלא מקלידים בשדה. אפשר ללחוץ <kbd>Ctrl</kbd>+<kbd>K</kbd> מכל מקום כדי לעבור במהירות לחיפוש.',
            'reset.title': 'איפוס הסיסמה',
            'reset.setPassword': 'הגדרת סיסמה חדשה',
            'reset.missingToken': 'קישור האיפוס אינו מכיל אסימון.',
            'reset.redirecting': 'מעביר למסך הכניסה…',
            'reset.failed': 'לא ניתן לאפס את הסיסמה.',
            'verify.title': 'אימות דוא״ל',
            'verify.progress': 'מאמת את כתובת הדוא״ל…',
            'verify.continue': 'המשך לכניסה',
            'verify.missingToken': 'לא נמצא אסימון אימות בקישור.',
            'verify.success': 'כתובת הדוא״ל אומתה.',
            'verify.failed': 'האימות נכשל.',
            'help.title': 'עזרה ומדריך שימוש',
            'help.skip': 'דילוג לתוכן העזרה',
            'help.back': 'חזרה לאוסף שלי',
            'help.intro': 'ברוכים הבאים! אוסף התקליטים שלי הוא קטלוג פרטי לתקליטי ויניל, תקליטורים, קלטות והקלטות דיגיטליות. כאן נמצא כל מה שצריך כדי להתחיל.',
            'help.account.title': '1. החשבון שלך',
            'help.account.create': 'אפשר <strong>ליצור חשבון</strong> במסך הכניסה. החשבון הראשון שנוצר הופך לחשבון המנהל.',
            'help.account.private': 'האוסף <strong>פרטי ורק שלך</strong> — משתמשים אחרים אינם יכולים לראות אותו.',
            'help.account.menu': 'בתפריט <strong>החשבון</strong> (למעלה, לצד שמך) אפשר לצאת, לצפות בכתב הוויתור או למחוק את החשבון.',
            'help.add.title': '2. הוספת תקליטים',
            'help.add.one': 'לחיצה על <strong>+ הוספת תקליט</strong>.',
            'help.add.two': 'הזנת האמן והאלבום (שדות חובה). באמצעות <strong>🔍 חיפוש מידע</strong> אפשר למלא אוטומטית שנה, סגנון ותמונת עטיפה מתוך MusicBrainz,‏ iTunes או Deezer.',
            'help.add.three': 'אפשר להגדיר גם פורמט, מצב, הערות ו<strong>תגיות/מדפים</strong>.',
            'help.add.four': 'לחיצה על <strong>שמירת תקליט</strong>.',
            'help.add.csv': 'אפשר גם לבחור <strong>ייבוא CSV</strong> מתוך תפריט <strong>נתונים</strong> כדי להוסיף תקליטים רבים בבת אחת.',
            'help.browse.title': '3. עיון וחיפוש',
            'help.browse.search': 'אפשר לחפש לפי אמן, אלבום או הערות ולסנן לפי סגנון, שנה או פורמט.',
            'help.browse.views': 'אפשר לעבור בין תצוגת <strong>רשת</strong> לתצוגת <strong>רשימה</strong>.',
            'help.browse.random': 'לחיצה על <strong>🎲 הפתע אותי</strong> תבחר תקליט אקראי להשמעה.',
            'help.browse.detail': 'לחיצה על כרטיס תפתח תצוגה מלאה עם רשימת רצועות, דירוגים והיסטוריה.',
            'help.ratings.title': '4. דירוגים, השמעות ותגיות',
            'help.ratings.rate': 'אפשר לדרג תקליט מ-1 עד 5 כוכבים בתצוגה המלאה.',
            'help.ratings.play': 'לחיצה על <strong>💿 סימון כהושמע</strong> בכרטיס או בתצוגה המלאה תתעד האזנה ותעדכן את <strong>ההיסטוריה</strong> והרצפים.',
            'help.ratings.tags': 'אפשר להוסיף <strong>תגיות/מדפים</strong> (לדוגמה <em>מועדפים</em> או <em>למכירה</em>) כדי לקבץ תקליטים. לחיצה על תגית תסנן לפיה.',
            'help.wishlist.title': '5. רשימת משאלות והיסטוריה',
            'help.wishlist.wish': '<strong>💝 רשימת המשאלות</strong> עוקבת אחר תקליטים שברצונך לקנות, כולל מחיר יעד.',
            'help.wishlist.history': '<strong>📻 היסטוריה</strong> מציגה את ההשמעות שלך, כולל נתונים ורצפים.',
            'help.backup.title': '6. גיבויים והנתונים שלך',
            'help.backup.copy': 'בתפריט <strong>נתונים</strong> אפשר לבחור <strong>גיבוי</strong> כדי להוריד עותק JSON מלא של האוסף, או <strong>שחזור</strong> כדי לייבא עותק (כפילויות ידולגו).',
            'help.backup.keep': 'מומלץ לשמור גיבויים עצמאיים — מידע נוסף ב<a href="#" id="helpDisclaimer">כתב הוויתור בנושא נתונים ושימוש</a>.',
            'help.appearance.title': '7. מראה',
            'help.appearance.theme': 'בתפריט <strong>🖥️ ערכת נושא</strong> אפשר לבחור מצב בהיר, כהה או מערכת (בהתאם להגדרת המכשיר).',
            'help.admin.title': '8. מנהלים',
            'help.admin.manage': 'למנהלים מוצגת האפשרות <strong>👥 ניהול משתמשים</strong> בתפריט החשבון. שם אפשר לאשר הרשמות, להפעיל או להשבית משתמשים, לשנות תפקידים ולמחוק משתמשים ואת הנתונים שלהם.',
            'help.admin.registration': 'כשהאתר מוכן להרשמה חופשית, אפשר להפעיל שם את האפשרות <strong>הרשמה עצמית פתוחה</strong>.',
            'help.delete.title': '9. מחיקת החשבון',
            'help.delete.body': 'בתפריט החשבון בוחרים <strong>מחיקת החשבון שלי</strong>. פעולה זו מוחקת לצמיתות את החשבון ואת כל הנתונים. כדאי לגבות קודם אם ברצונך לשמור עותק.'
        }
    };

    function readLanguage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
        } catch (error) {
            // Storage can be unavailable in restricted browser contexts.
        }
        return DEFAULT_LANGUAGE;
    }

    let language = readLanguage();
    const originalValues = new WeakMap();
    let originalTitle = '';

    function applyDocumentLanguage() {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    }

    function interpolate(message, values) {
        return message.replace(/\{(\w+)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
        );
    }

    function t(key, values = {}, fallback = key) {
        const hasCount = typeof values.count === 'number';
        const pluralKey = hasCount
            ? `${key}.${new Intl.PluralRules(language).select(values.count)}`
            : key;
        const translated = messages[language][pluralKey]
            || (hasCount ? messages[language][`${key}.other`] : '')
            || messages[language][key]
            || messages.en[pluralKey]
            || (hasCount ? messages.en[`${key}.other`] : '')
            || messages.en[key]
            || fallback;
        return interpolate(translated, values);
    }

    function translateElement(element) {
        let originals = originalValues.get(element);
        if (!originals) {
            originals = {
                text: element.textContent,
                html: element.innerHTML,
                placeholder: element.getAttribute('placeholder'),
                title: element.getAttribute('title'),
                ariaLabel: element.getAttribute('aria-label')
            };
            originalValues.set(element, originals);
        }
        if (element.dataset.i18nHtml) {
            element.innerHTML = language === DEFAULT_LANGUAGE
                ? originals.html
                : t(element.dataset.i18nHtml);
        } else if (element.dataset.i18n) {
            element.textContent = language === DEFAULT_LANGUAGE
                ? originals.text
                : t(element.dataset.i18n);
        }
        ['placeholder', 'title', 'ariaLabel'].forEach(property => {
            const dataProperty = `i18n${property[0].toUpperCase()}${property.slice(1)}`;
            if (element.dataset[dataProperty]) {
                const attribute = property === 'ariaLabel' ? 'aria-label' : property;
                const translated = language === DEFAULT_LANGUAGE
                    ? originals[property]
                    : t(element.dataset[dataProperty]);
                if (translated === null) element.removeAttribute(attribute);
                else element.setAttribute(attribute, translated);
            }
        });
    }

    function translate(root = document) {
        if (root instanceof Element && root.matches('[data-i18n], [data-i18n-html], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label]')) {
            translateElement(root);
        }
        root.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label]')
            .forEach(translateElement);
        if (document.body && document.body.dataset.i18nTitle) {
            if (!originalTitle) originalTitle = document.title;
            document.title = language === DEFAULT_LANGUAGE ? originalTitle : t(document.body.dataset.i18nTitle);
        }
    }

    function updateLanguageToggle() {
        const button = document.getElementById('languageToggle');
        if (!button) return;
        button.textContent = language === 'he' ? 'En' : 'He';
        button.setAttribute('aria-label', language === 'he' ? 'Switch language to English' : 'מעבר לעברית');
        button.setAttribute('lang', language === 'he' ? 'en' : 'he');
        button.setAttribute('dir', language === 'he' ? 'ltr' : 'rtl');
    }

    function positionLanguageToggle() {
        const button = document.getElementById('languageToggle');
        const headerNavigation = document.querySelector('.header-nav');
        if (!button || !headerNavigation) return;

        const accountMenu = headerNavigation.querySelector('#account-menu');
        if (!accountMenu) return;

        let group = headerNavigation.querySelector('.header-account-group');
        if (!group) {
            group = document.createElement('div');
            group.className = 'header-account-group';
            headerNavigation.insertBefore(group, accountMenu);
        }
        if (button.parentElement !== group) group.appendChild(button);
        if (accountMenu.parentElement !== group) group.appendChild(accountMenu);
    }

    function setLanguage(nextLanguage) {
        if (!SUPPORTED_LANGUAGES.includes(nextLanguage) || nextLanguage === language) return;
        language = nextLanguage;
        try {
            localStorage.setItem(STORAGE_KEY, language);
        } catch (error) {
            // The language still applies for the current page when storage is unavailable.
        }
        applyDocumentLanguage();
        translate();
        updateLanguageToggle();
        document.dispatchEvent(new CustomEvent('rc:languagechange', { detail: { language } }));
    }

    function mountLanguageToggle() {
        if (document.getElementById('languageToggle')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'languageToggle';
        button.className = 'language-toggle';
        button.addEventListener('click', () => setLanguage(language === 'he' ? 'en' : 'he'));
        const headerNavigation = document.querySelector('.header-nav');
        if (headerNavigation) {
            const themePicker = headerNavigation.querySelector('#theme-picker');
            if (themePicker) themePicker.after(button);
            else headerNavigation.prepend(button);
        } else {
            document.body.appendChild(button);
        }
        updateLanguageToggle();
        positionLanguageToggle();
    }

    applyDocumentLanguage();
    window.I18n = {
        t,
        translate,
        setLanguage,
        get language() { return language; },
        get locale() { return language === 'he' ? 'he-IL' : 'en-US'; },
        formatDate(value, options) {
            return new Intl.DateTimeFormat(this.locale, options).format(new Date(value));
        },
        formatNumber(value, options) {
            return new Intl.NumberFormat(this.locale, options).format(value);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        translate();
        mountLanguageToggle();
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
                if (node instanceof Element) translate(node);
            }));
            positionLanguageToggle();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
})();