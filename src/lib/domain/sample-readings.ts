type L = { ru: string; en: string; ar: string };

function loc(pack: L, locale: string): string {
  if (locale === "en") return pack.en;
  if (locale === "ar") return pack.ar;
  return pack.ru;
}

/** Public major-arcana names and keywords, rewritten into original short copy. 22 maps to the Fool. */
export const ARCANA: Record<
  number,
  { name: L; gist: L; light: L; shadow: L; practice: L }
> = {
  1: {
    name: { ru: "Маг", en: "The Magician", ar: "الساحر" },
    gist: { ru: "воля, концентрация, умение собрать средства в одно действие", en: "will, focus, turning tools into a single act", ar: "الإرادة والتركيز وجمع الوسائل في فعل واحد" },
    light: { ru: "человек говорит и делает в одну сторону", en: "speech and action line up", ar: "يتوافق القول مع الفعل" },
    shadow: { ru: "распыление, пустые обещания, поза уверенности без дела", en: "scatter, empty promises, a pose without work", ar: "تشتت ووعود فارغة وثقة بلا عمل" },
    practice: { ru: "выберите одно действие на ближайшие сутки и доведите его до конца", en: "pick one act for the next day and finish it", ar: "اختر فعلاً واحداً لليوم التالي وأتمّه" }
  },
  2: {
    name: { ru: "Верховная Жрица", en: "The High Priestess", ar: "الكاهنة العليا" },
    gist: { ru: "тишина, интуиция, знание, которое не спорит вслух", en: "quiet, intuition, knowledge that does not argue out loud", ar: "الهدوء والحدس ومعرفة لا تجادل بصوت عال" },
    light: { ru: "человек слышит паузу и не заполняет её шумом", en: "a person hears the pause and does not fill it with noise", ar: "يسمع الشخص الصمت ولا يملؤه بالضجيج" },
    shadow: { ru: "замкнутость, недоговорённость, отказ проверять чутьё фактами", en: "withdrawal, half-said things, refusing to test instinct", ar: "انغلاق وغموض ورفض اختبار الحدس بالواقع" },
    practice: { ru: "перед решением выдержите паузу и запишите, что уже известно", en: "pause before deciding and write down what is already known", ar: "توقّف قبل القرار واكتب ما تعرفه سلفاً" }
  },
  3: {
    name: { ru: "Императрица", en: "The Empress", ar: "الإمبراطورة" },
    gist: { ru: "рост, забота, плодородная среда, в которой вещи созревают", en: "growth, care, a fertile setting where things ripen", ar: "النمو والرعاية وبيئة خصبة تنضج فيها الأمور" },
    light: { ru: "умение кормить процесс вниманием, не ломая его контролем", en: "feeding a process with attention without crushing it", ar: "تغذية المسار بالاهتمام دون سحقه بالسيطرة" },
    shadow: { ru: "размытость границ, усталость от заботы, застой под видом уюта", en: "blurred boundaries, care fatigue, comfort that stalls", ar: "حدود ضبابية وإرهاق الرعاية وراحة توقف الحركة" },
    practice: { ru: "уберите лишнее и дайте одному делу тепло и срок", en: "clear the extra and give one matter warmth and a deadline", ar: "أزل الزائد وأعطِ أمراً واحداً دفئاً وأجلاً" }
  },
  4: {
    name: { ru: "Император", en: "The Emperor", ar: "الإمبراطور" },
    gist: { ru: "порядок, опора, ответственность за рамку", en: "order, backbone, owning the frame", ar: "النظام والسناد ومسؤولية الإطار" },
    light: { ru: "ясные правила, на которые можно опереться", en: "clear rules that can be leaned on", ar: "قواعد واضحة يمكن الاتكاء عليها" },
    shadow: { ru: "жёсткость, контроль ради контроля, страх хаоса", en: "rigidity, control for its own sake, fear of chaos", ar: "تصلّب وسيطرة لذاتها وخوف من الفوضى" },
    practice: { ru: "напишите три правила, которые вы реально готовы соблюдать", en: "write three rules you will actually keep", ar: "اكتب ثلاثة قواعد أنت مستعد للالتزام بها" }
  },
  5: {
    name: { ru: "Иерофант", en: "The Hierophant", ar: "الكاهن" },
    gist: { ru: "традиция, наставничество, передача формы дальше", en: "tradition, teaching, handing a form onward", ar: "التقليد والتعليم ونقل الصيغة قدماً" },
    light: { ru: "опора на проверенный путь и уважение к учителю", en: "trusting a tested path and respecting a teacher", ar: "الاتكاء على طريق مجرّب واحترام المعلّم" },
    shadow: { ru: "слепое следование, морализаторство, страх своего голоса", en: "blind following, moralizing, fear of one's own voice", ar: "اتباع أعمى ووعظ وخوف من الصوت الخاص" },
    practice: { ru: "отделите, что вы храните как ценность, а что держите по привычке", en: "separate what you keep as a value from what you keep by habit", ar: "افصل ما تحفظه كقيمة عما تبقيه بحكم العادة" }
  },
  6: {
    name: { ru: "Влюблённые", en: "The Lovers", ar: "العشاق" },
    gist: { ru: "выбор сердца, союз, согласие двух сторон", en: "a heart-choice, union, two sides agreeing", ar: "اختيار القلب والاتحاد ووفاق طرفين" },
    light: { ru: "честный выбор и способность стоять в паре", en: "an honest choice and the capacity to stand as a pair", ar: "اختيار صادق والقدرة على الوقوف كزوج" },
    shadow: { ru: "раздвоение, угождение всем, откладывание решения", en: "split loyalty, pleasing everyone, delaying the choice", ar: "انقسام وإرضاء الجميع وتأجيل القرار" },
    practice: { ru: "назовите выбор вслух одним предложением и не размывайте его", en: "name the choice in one spoken sentence and do not blur it", ar: "سمِّ الاختيار بجملة واحدة ولا تُبهِمه" }
  },
  7: {
    name: { ru: "Колесница", en: "The Chariot", ar: "العجلة" },
    gist: { ru: "движение вперёд, сбор воли, победа через направление", en: "forward motion, gathered will, victory through direction", ar: "التقدم وجمع الإرادة والنصر عبر الاتجاه" },
    light: { ru: "человек держит курс, даже когда кони тянут врозь", en: "holding course even when the horses pull apart", ar: "الثبات على المسار حتى حين تشدّ القوى في اتجاهين" },
    shadow: { ru: "гонка, упрямство, победа любой ценой", en: "rushing, stubbornness, winning at any cost", ar: "اندفاع وعناد والانتصار بأي ثمن" },
    practice: { ru: "выберите вектор на неделю и уберите одну помеху с дороги", en: "choose a week's vector and remove one obstacle from the road", ar: "اختر اتجاهاً للأسبوع وأزل عائقاً واحداً من الطريق" }
  },
  8: {
    name: { ru: "Сила", en: "Strength", ar: "القوة" },
    gist: { ru: "мягкая власть над импульсом, терпение, внутренняя мощь", en: "gentle authority over impulse, patience, inner power", ar: "سلطة لطيفة على الاندفاع وصبر وقوة داخلية" },
    light: { ru: "можно быть твёрдым, не повышая голоса", en: "firm without raising the voice", ar: "حزم دون رفع الصوت" },
    shadow: { ru: "подавление себя или других, усталость от сдержанности", en: "suppressing self or others, exhaustion from restraint", ar: "قمع الذات أو الآخرين وإرهاق من الكبح" },
    practice: { ru: "встретьте сильную эмоцию и дайте ей форму, не давая ей рулить", en: "meet a strong emotion and give it form without letting it drive", ar: "واجه شعوراً قوياً وأعطه شكلاً دون أن يقودك" }
  },
  9: {
    name: { ru: "Отшельник", en: "The Hermit", ar: "الناسك" },
    gist: { ru: "уединение, свой свет, поиск правды без толпы", en: "solitude, one's own lamp, truth without the crowd", ar: "العزلة ونور خاص والبحث عن الحق بلا جماعة" },
    light: { ru: "человек умеет остаться наедине и не потерять смысл", en: "able to stay alone without losing meaning", ar: "القدرة على البقاء وحيداً دون فقدان المعنى" },
    shadow: { ru: "изоляция, недоверие, холод под видом мудрости", en: "isolation, mistrust, coldness posing as wisdom", ar: "انعزال وسوء ظن وبرودة تتنكّر حكمة" },
    practice: { ru: "выделите час без экрана и сформулируйте один честный вывод", en: "take an hour off-screen and write one honest conclusion", ar: "خصّص ساعة بلا شاشة واكتب خلاصة صادقة واحدة" }
  },
  10: {
    name: { ru: "Колесо Фортуны", en: "Wheel of Fortune", ar: "عجلة الحظ" },
    gist: { ru: "цикл, смена фазы, умение не путать момент с вечностью", en: "a cycle, a phase-shift, not mistaking a moment for forever", ar: "دورة وتبدّل طور وعدم خلط اللحظة بالأبد" },
    light: { ru: "гибкость: когда волна идёт — сесть, когда уходит — не цепляться", en: "flexibility: ride the wave, release it when it goes", ar: "مرونة: اركب الموجة واتركها حين تنصرف" },
    shadow: { ru: "суеверие, пассивность, обвинение судьбы", en: "superstition, passivity, blaming fate", ar: "خرافة وسلبية ولوم القدر" },
    practice: { ru: "отметьте, какая фаза сейчас, и какое одно действие ей соответствует", en: "name the current phase and the one action that fits it", ar: "سمِّ الطور الحالي والفعل الواحد الذي يناسبه" }
  },
  11: {
    name: { ru: "Справедливость", en: "Justice", ar: "العدالة" },
    gist: { ru: "мера, честный счёт, последствия без самообмана", en: "measure, an honest tally, consequences without self-deceit", ar: "ميزان وحساب صادق ونتائج بلا خداع للذات" },
    light: { ru: "человек называет вещи своими именами и платит по счетам", en: "calling things by their names and paying what is owed", ar: "تسمية الأمور بأسمائها وسداد ما يُستحق" },
    shadow: { ru: "самосуд, оправдания, перекос весов в свою пользу", en: "self-judging, excuses, tipping the scales", ar: "محاكمة ذاتية وأعذار وإمالة الميزان للنفس" },
    practice: { ru: "закройте один незакрытый счёт — долг, извинение или обещание", en: "close one open account — a debt, an apology, or a promise", ar: "أغلق حساباً معلّقاً: ديناً أو اعتذاراً أو وعداً" }
  },
  12: {
    name: { ru: "Повешенный", en: "The Hanged Man", ar: "المعلّق" },
    gist: { ru: "пауза, смена угла зрения, добровольная остановка", en: "a pause, a new angle, a chosen halt", ar: "وقفة وزاوية جديدة وتوقّف مختار" },
    light: { ru: "человек умеет подождать, пока картина перевернётся", en: "willing to wait until the picture turns", ar: "الاستعداد للانتظار حتى تنقلب الصورة" },
    shadow: { ru: "зависание, жертвенность без смысла, отказ действовать", en: "limbo, pointless sacrifice, refusal to act", ar: "تعليق وتضحية بلا معنى ورفض الفعل" },
    practice: { ru: "на три дня смените привычный порядок и смотрите, что станет видно", en: "change the usual order for three days and watch what appears", ar: "غيّر الترتيب المعتاد ثلاثة أيام وانظر ماذا يظهر" }
  },
  13: {
    name: { ru: "Смерть", en: "Death", ar: "الموت" },
    gist: { ru: "завершение формы, чтобы началось следующее", en: "ending a form so the next can begin", ar: "ختام صيغة ليبدأ ما يليها" },
    light: { ru: "честное прощание и место для нового", en: "an honest farewell and room for the new", ar: "وداع صادق ومساحة للجديد" },
    shadow: { ru: "цепляние за отжившее, страх пустоты, затянутый конец", en: "clinging to the spent, fear of emptiness, a drawn-out ending", ar: "التشبث بما انتهى وخوف الفراغ ونهاية ممتدة" },
    practice: { ru: "назовите, что уже закончилось, и ритуально отпустите одну вещь", en: "name what has already ended and ritually release one thing", ar: "سمِّ ما انتهى فعلاً وأطلق شيئاً واحداً بطقس بسيط" }
  },
  14: {
    name: { ru: "Умеренность", en: "Temperance", ar: "الاعتدال" },
    gist: { ru: "смешение противоположностей, ритм, живая середина", en: "blending opposites, rhythm, a living middle", ar: "مزج الأضداد وإيقاع ووسط حي" },
    light: { ru: "человек не кидается из края в край, а держит температуру", en: "not swinging from edge to edge, holding temperature", ar: "عدم القفز من طرف لطرف والحفاظ على الحرارة" },
    shadow: { ru: "размытость, вечный компромисс, страх острого решения", en: "vagueness, endless compromise, fear of a sharp call", ar: "غموض وتسوية أبدية وخوف من قرار حاد" },
    practice: { ru: "найдите меру: меньше крайности, больше регулярности", en: "find a measure: less extreme, more regular", ar: "جد مقياساً: أقل تطرفاً وأكثر انتظاماً" }
  },
  15: {
    name: { ru: "Дьявол", en: "The Devil", ar: "الشيطان" },
    gist: { ru: "привязка, вожделение, сила, которую не признают", en: "a bond, appetite, a power that goes unnamed", ar: "ارتباط وشهوة وقوة لا يُعترف بها" },
    light: { ru: "честный взгляд на желание и на то, кто кем владеет", en: "an honest look at desire and who holds whom", ar: "نظرة صادقة إلى الرغبة وإلى من يملك من" },
    shadow: { ru: "зависимость, торг, стыд, который держит в клетке", en: "dependency, bargaining, shame that cages", ar: "تبعية ومساومة وخجل يحبس في قفص" },
    practice: { ru: "назовите привязку вслух и назначьте ей границу на эту неделю", en: "name the bond out loud and set it a boundary this week", ar: "سمِّ الارتباط جهراً وضع له حداً هذا الأسبوع" }
  },
  16: {
    name: { ru: "Башня", en: "The Tower", ar: "البرج" },
    gist: { ru: "обвал ложной конструкции, внезапная ясность", en: "collapse of a false structure, sudden clarity", ar: "انهيار بناء زائف ووضوح مفاجئ" },
    light: { ru: "освобождение от стены, которая казалась защитой", en: "release from a wall that looked like shelter", ar: "تحرر من جدار بدا حماية" },
    shadow: { ru: "шок, разрушение ради драмы, отказ собирать заново", en: "shock, destruction as drama, refusing to rebuild", ar: "صدمة وهدم للمسرح ورفض إعادة البناء" },
    practice: { ru: "уберите одну ложную опору сами, пока её не выбило снаружи", en: "remove one false support yourself before the outside does", ar: "أزل سنداً زائفاً بنفسك قبل أن يُقتلع من الخارج" }
  },
  17: {
    name: { ru: "Звезда", en: "The Star", ar: "النجمة" },
    gist: { ru: "надежда после бури, тихий ориентир, восстановление", en: "hope after storm, a quiet landmark, restoration", ar: "أمل بعد العاصفة وعلامة هادئة وترميم" },
    light: { ru: "человек снова видит смысл и не торопит его", en: "meaning returns and is not rushed", ar: "يعود المعنى دون استعجاله" },
    shadow: { ru: "наивность, уход в мечту, отказ от земли", en: "naivety, fleeing into dream, refusing the ground", ar: "سذاجة وهروب إلى الحلم ورفض الأرض" },
    practice: { ru: "сделайте маленький жест надежды в материи: вода, воздух, помощь", en: "make a small hopeful gesture in matter: water, air, help", ar: "افعل إيماءة أمل صغيرة في المادة: ماء أو هواء أو عون" }
  },
  18: {
    name: { ru: "Луна", en: "The Moon", ar: "القمر" },
    gist: { ru: "неясность, образы, страх и чутьё в тумане", en: "blur, images, fear and instinct in fog", ar: "غموض وصور وخوف وحدس في ضباب" },
    light: { ru: "воображение работает, и человек не путает его с фактом", en: "imagination works without being mistaken for fact", ar: "يعمل الخيال دون أن يُحسب حقيقة" },
    shadow: { ru: "тревога, проекции, блуждание без проверки", en: "anxiety, projections, wandering without a check", ar: "قلق وإسقاط وتيه بلا تحقق" },
    practice: { ru: "отделите факт, страх и образ — запишите три колонки", en: "split fact, fear, and image into three columns", ar: "افصل الواقع والخوف والصورة في ثلاثة أعمدة" }
  },
  19: {
    name: { ru: "Солнце", en: "The Sun", ar: "الشمس" },
    gist: { ru: "ясность, тепло, простая радость быть видимым", en: "clarity, warmth, the simple joy of being seen", ar: "وضوح ودفء وفرح بسيط بأن تُرى" },
    light: { ru: "человек светит без игры в скромность и без хвастовства", en: "shining without false modesty or boast", ar: "إشراق بلا تواضع زائف وبلا تفاخر" },
    shadow: { ru: "выгорание, потребность в овациях, непереносимость тени", en: "burnout, needing applause, intolerance of shade", ar: "احتراق وحاجة للتصفيق وعدم احتمال الظل" },
    practice: { ru: "выйдите на свет: скажите важное прямо и поблагодарите тело", en: "step into the light: say the important thing plainly and thank the body", ar: "اخرج إلى النور: قل المهم بوضوح واشكر الجسد" }
  },
  20: {
    name: { ru: "Суд", en: "Judgement", ar: "الحساب" },
    gist: { ru: "призыв, итог, пробуждение к более широкой жизни", en: "a call, a reckoning, waking into a wider life", ar: "نداء وحساب وصحوة إلى حياة أوسع" },
    light: { ru: "человек слышит зов и отвечает, не откладывая", en: "hearing the call and answering without delay", ar: "سماع النداء والإجابة دون تأجيل" },
    shadow: { ru: "самобичевание, страх оценки, вечное «ещё не готов»", en: "self-flagellation, fear of being judged, endless unreadiness", ar: "جلد الذات وخوف التقييم و«لست جاهزاً» الأبدي" },
    practice: { ru: "ответьте на один отложенный зов: звонок, письмо, признание", en: "answer one postponed call: a phone call, a letter, an admission", ar: "أجب نداءً مؤجلاً: مكالمة أو رسالة أو اعتراف" }
  },
  21: {
    name: { ru: "Мир", en: "The World", ar: "العالم" },
    gist: { ru: "целостность, завершённый круг, место в большом танце", en: "wholeness, a finished circle, a place in the larger dance", ar: "اكتمال ودائرة مغلقة ومكان في الرقص الأكبر" },
    light: { ru: "человек собирает опыт в одно и может поставить точку", en: "gathering experience into one and placing the period", ar: "جمع الخبرة في واحد ووضع النقطة" },
    shadow: { ru: "незакрытые хвосты, страх конца, бесконечная доработка", en: "loose ends, fear of ending, endless polishing", ar: "أطراف معلّقة وخوف الختام وتنقيح لا ينتهي" },
    practice: { ru: "завершите цикл официально: праздник, отчёт, передача дальше", en: "close the cycle formally: a feast, a report, a handoff", ar: "أغلق الدورة رسمياً: احتفال أو تقرير أو تسليم" }
  },
  22: {
    name: { ru: "Шут", en: "The Fool", ar: "الأحمق" },
    gist: { ru: "начало пути, доверие шагу, лёгкость без карты", en: "the start of a road, trust in the step, lightness without a map", ar: "بداية طريق وثقة بالخطوة وخفّة بلا خريطة" },
    light: { ru: "свежий взгляд и готовность учиться играючи", en: "a fresh eye and a willingness to learn by play", ar: "عين جديدة واستعداد للتعلّم باللعب" },
    shadow: { ru: "беспечность, срыв с обрыва, отказ взрослеть", en: "carelessness, stepping off a cliff, refusing to grow", ar: "طيش والسقوط من الحافة ورفض النضج" },
    practice: { ru: "сделайте новый шаг маленьким и обратимым — и сделайте его сегодня", en: "make the new step small and reversible — and take it today", ar: "اجعل الخطوة الجديدة صغيرة وقابلة للرجوع — وقم بها اليوم" }
  }
};

const SPHERE: Record<string, { field: L; ask: L }> = {
  personality: {
    field: { ru: "характера и личного проявления", en: "character and how a person shows up", ar: "الطبع وظهور الشخص" },
    ask: { ru: "как вы держаетесь в мире", en: "how you hold yourself in the world", ar: "كيف تثبت نفسك في العالم" }
  },
  spirituality: {
    field: { ru: "смысла, веры и внутренней тишины", en: "meaning, faith, and inner quiet", ar: "المعنى والإيمان والهدوء الداخلي" },
    ask: { ru: "чему вы служите, когда никто не смотрит", en: "what you serve when nobody is watching", ar: "ماذا تخدم حين لا يراك أحد" }
  },
  money: {
    field: { ru: "дела, денег и реализации дара", en: "work, money, and making a gift real", ar: "العمل والمال وتحقيق الموهبة" },
    ask: { ru: "как талант становится видимым результатом", en: "how talent becomes a visible result", ar: "كيف تتحول الموهبة إلى نتيجة مرئية" }
  },
  relationships: {
    field: { ru: "близости, договора и чужого края", en: "closeness, agreement, and the other person's edge", ar: "القرب والعهد وحدود الآخر" },
    ask: { ru: "как вы встречаете другого человека", en: "how you meet another person", ar: "كيف تلتقي بالآخر" }
  },
  health: {
    field: { ru: "тела, ритма и запаса сил", en: "the body, rhythm, and the store of strength", ar: "الجسد والإيقاع ومخزون القوة" },
    ask: { ru: "как организм держит вашу жизнь", en: "how the organism holds your life", ar: "كيف يحمل الجسد حياتك" }
  },
  soulMission: {
    field: { ru: "сквозного смысла всей звезды", en: "the through-line of the whole star", ar: "المعنى العابر لكل النجمة" },
    ask: { ru: "зачем собрана эта карта", en: "why this map was gathered", ar: "لماذا جُمعت هذه الخريطة" }
  }
};

const POINT: Record<string, L> = {
  apex: {
    ru: "Это опорный тон сферы: от него читаются остальные грани.",
    en: "This is the sphere's keynote; the other faces are read from it.",
    ar: "هذا هو النغم الأساس للمجال، ومنه تُقرأ بقية الأوجه."
  },
  ancestral_program: {
    ru: "Тема приходит как семейный сценарий: её не выбирали, но её можно вести иначе.",
    en: "The theme arrives as a family script: unchosen, yet it can be led differently.",
    ar: "تأتي المسألة كسيناريو عائلي: لم تُختر، لكن يمكن قيادتها بشكل آخر."
  },
  fatal_error: {
    ru: "Здесь число показывает повторяющуюся ошибку: если игнорировать её, круг схлопывается.",
    en: "Here the number marks a repeating error: ignore it and the circle collapses.",
    ar: "هنا يشير الرقم إلى خطأ متكرر: تجاهله فيُغلق الحلقة."
  },
  past_life: {
    ru: "Внутренняя грань той же сферы: то же число звучит тише, ближе к привычке.",
    en: "An inner face of the same sphere: the same number sounds quieter, closer to habit.",
    ar: "وجه داخلي لنفس المجال: الرقم ذاته يُسمع أهدأ، أقرب إلى العادة."
  },
  soul_mission: {
    ru: "Центр звезды: число собирает пять сфер в один ответ, зачем вы здесь.",
    en: "The star's centre: the number gathers five spheres into one why.",
    ar: "مركز النجمة: يجمع الرقم المجالات الخمس في إجابة واحدة عن السبب."
  }
};

function arcanaOf(value: number) {
  const n = value >= 1 && value <= 22 ? value : ((((value - 1) % 22) + 22) % 22) + 1;
  return { n, ...ARCANA[n]! };
}

export function sampleTitle(value: number, locale: string): string {
  const { n, name } = arcanaOf(value);
  const nm = loc(name, locale);
  if (locale === "ar") return `${n}. ${nm}`;
  return `${n}. ${nm}`;
}

export function samplePlain(params: {
  sphere: string;
  role: string;
  sphereName: string;
  value: number;
  locale: string;
  kind: string;
}): { title: string; lead: string; paragraphs: string[] } {
  const locale = params.locale;
  const a = arcanaOf(params.value);
  const name = loc(a.name, locale);
  const gist = loc(a.gist, locale);
  const light = loc(a.light, locale);
  const shadow = loc(a.shadow, locale);
  const practice = loc(a.practice, locale);
  const sphere = SPHERE[params.sphere] ?? SPHERE.personality;
  const field = loc(sphere.field, locale);
  const ask = loc(sphere.ask, locale);
  const point = loc(POINT[params.kind] ?? POINT.apex, locale);
  const title = sampleTitle(params.value, locale);

  if (locale === "en") {
    return {
      title,
      lead: `In «${params.sphereName}» arcana ${a.n} «${name}» is read as «${params.role}»: ${gist}.`,
      paragraphs: [
        `For ${field}, the number ${a.n} in «${params.role}» answers ${ask}. ${point}`,
        `In plus this looks like ${light}. The gift of «${name}» here is not a slogan — it is a way of moving through ${params.sphereName.toLowerCase()}.`,
        `In minus it slips into ${shadow}. A practical check: ${practice}. Keep this note next to the number ${a.n}, not as a fortune but as a working hypothesis for this sphere.`
      ]
    };
  }
  if (locale === "ar") {
    return {
      title,
      lead: `في «${params.sphereName}» يُقرأ الأركان ${a.n} «${name}» بوصفه «${params.role}»: ${gist}.`,
      paragraphs: [
        `في ميدان ${field} يجيب الرقم ${a.n} عند «${params.role}» عن ${ask}. ${point}`,
        `في الجانب النيّر يبدو هذا كالتالي: ${light}. هبة «${name}» هنا ليست شعاراً، بل أسلوب مرور عبر ${params.sphereName}.`,
        `في الجانب الظل ينزلق إلى ${shadow}. فحص عملي: ${practice}. أبقِ هذه الملاحظة بجانب الرقم ${a.n} كفرضية عمل لهذا المجال، لا كقدر مغلق.`
      ]
    };
  }
  return {
    title,
    lead: `В сфере «${params.sphereName}» аркан ${a.n} «${name}» читается как «${params.role}»: ${gist}.`,
    paragraphs: [
      `Для ${field} число ${a.n} в точке «${params.role}» отвечает на вопрос, ${ask}. ${point}`,
      `В плюсе это выглядит так: ${light}. Дар «${name}» здесь — не лозунг, а способ двигаться внутри сферы «${params.sphereName}».`,
      `В минусе уклон идёт в ${shadow}. Практическая проверка: ${practice}. Держите эту заметку рядом с числом ${a.n} как рабочую гипотезу для этой сферы, а не как приговор.`
    ]
  };
}

export function sampleStructured(params: {
  role: string;
  value: number;
  locale: string;
}): { title: string; blocks: { mark: string; label: string; text: string }[] } {
  const locale = params.locale;
  const a = arcanaOf(params.value);
  const name = loc(a.name, locale);
  const gist = loc(a.gist, locale);
  const light = loc(a.light, locale);
  const shadow = loc(a.shadow, locale);
  const practice = loc(a.practice, locale);
  const title = sampleTitle(params.value, locale);
  if (locale === "en") {
    return {
      title,
      blocks: [
        { mark: "✦", label: "Talent", text: `Arcana ${a.n} «${name}» as «${params.role}» in Realization: ${gist}. Talent shows up when ${light}.` },
        { mark: "+", label: "Expression in plus", text: `Constructive face of «${name}»: the gift becomes a visible result, a craft, a sum of money or a finished piece of work.` },
        { mark: "−", label: "Expression in minus", text: `Shadow of «${name}» in this sphere: ${shadow}. Money and output start serving the pose instead of the task.` },
        { mark: "→", label: "Recommendations", text: `${practice}. Check the number ${a.n} against one real deliverable this week.` }
      ]
    };
  }
  if (locale === "ar") {
    return {
      title,
      blocks: [
        { mark: "✦", label: "الموهبة", text: `أركان ${a.n} «${name}» كنقطة «${params.role}» في مجال المال وتحقيق الذات: ${gist}. تظهر الموهبة حين ${light}.` },
        { mark: "+", label: "التجلي الإيجابي", text: `الوجه البنّاء لـ«${name}»: تتحول الهبة إلى نتيجة مرئية، صنعة، مبلغ أو عمل مكتمل.` },
        { mark: "−", label: "التجلي السلبي", text: `ظل «${name}» في هذا المجال: ${shadow}. يبدأ المال والناتج بخدمة الوضعية لا المهمة.` },
        { mark: "→", label: "توصيات", text: `${practice}. اختبر الرقم ${a.n} مقابل تسليم حقيقي واحد هذا الأسبوع.` }
      ]
    };
  }
  return {
    title,
    blocks: [
      { mark: "✦", label: "Талант", text: `Аркан ${a.n} «${name}» как «${params.role}» в сфере реализации: ${gist}. Талант проявляется, когда ${light}.` },
      { mark: "+", label: "Проявление в плюсе", text: `Светлая грань «${name}»: дар становится видимым результатом — ремеслом, суммой, законченной работой.` },
      { mark: "−", label: "Проявление в минусе", text: `Тень «${name}» в этой сфере: ${shadow}. Деньги и результат начинают служить позе, а не задаче.` },
      { mark: "→", label: "Рекомендации", text: `${practice}. Сверьте число ${a.n} с одним реальным делом на этой неделе.` }
    ]
  };
}
