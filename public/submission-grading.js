const lessonRequirements = {
  "level1-1-hello-java": [/\bmain\s*\([^)]*\)\s*(?:throws\s+[\w$.,\s]+)?\{\s*System\s*\.\s*out\s*\.\s*println\s*\(\s*"Hello, Java!"\s*\)\s*;\s*\}/],
  "level1-2-how-java-runs": [/println\s*\(\s*"源码文件：Main\.java"\s*\)\s*;[\s\S]*println\s*\(\s*"编译结果：Main\.class"\s*\)\s*;[\s\S]*println\s*\(\s*"运行入口：main 方法"\s*\)/],
  "level1-3-variables": [/\bString\s+name\s*=/, /\bint\s+age\s*=/, /\bString\s+city\s*=/, /println\s*\([^;]*\bname\b[^;]*\bage\b[^;]*\bcity\b/],
  "level1-4-primitive-and-reference": [/\bint\s+\w+\s*=/, /\bdouble\s+\w+\s*=/, /\bchar\s+\w+\s*=/, /\bboolean\s+\w+\s*=/, /\bString\s+\w+\s*=/, /(?:println\s*\([^;]*\);[\s\S]*?){5}/],
  "level1-5-operators": [/\btotal\s*=\s*(?:price\s*\*\s*count|count\s*\*\s*price)/, /balance\s*>=\s*total|total\s*<=\s*balance/, /println\s*\([^;]*\btotal\b/, /(?:println\s*\([^;]*\);[\s\S]*?){2}/],
  "level1-6-type-conversion": [/\bdouble\s+average\s*=/, /\bscore1\s*\+\s*score2\s*\+\s*score3\b/, /\(\s*double\s*\)|\/\s*3\.0/, /println\s*\([^;]*\baverage\b/],
  "level1-7-strings": [/\bfullName\s*=[^;]*\bfirstName\b[^;]*\blastName\b/, /String\.format\s*\([^;]*\bscore\b/, /fullName\.length\s*\(/],
  "level1-8-console-input": [/Scanner\s*\(\s*System\.in\s*\)/, /\.nextLine\s*\(/, /\.nextInt\s*\(|parseInt\s*\(/, /println\s*\([^;]*\bname\b/, /\bage\s*\+\s*1\b|1\s*\+\s*age\b/],
  "level2-if-else": [/\bif\s*\([^)]*temperature\s*>=\s*30/, /else\s+if\s*\([^)]*temperature\s*>=\s*15/, /天气炎热[\s\S]*天气舒适[\s\S]*注意保暖/],
  "level2-switch-expression": [/switch\s*\(\s*level\s*\)/, /\bcase\s+1\s*(?:->|:)\s*"青铜会员"/, /\bcase\s+2\s*(?:->|:)\s*"白银会员"/, /\bcase\s+3\s*(?:->|:)\s*"黄金会员"/, /\bdefault\s*(?:->|:)\s*"普通访客"/],
  "level2-while-loop": [/\bwhile\s*\(/, /\bsum\s*(?:\+=|=\s*sum\s*\+)/, /println\s*\([^;]*\bsum\b/],
  "level2-for-loop": [printsEvenNumbersWithForLoop],
  "level2-break-continue": [/\b(?:for|while)\s*\(/, /%\s*2\b/, /\bcontinue\s*;/, /\bbreak\s*;/, /println\s*\(/],
  "level2-method-basics": [/\bvoid\s+printWelcome\s*\(\s*\)\s*\{[^}]*println\s*\(\s*"欢迎进入方法世界"\s*\)/, /\bprintWelcome\s*\(\s*\)\s*;/],
  "level2-parameters-return-values": [/\bint\s+doubleNumber\s*\(\s*int\s+\w+\s*\)\s*\{[^}]*return\s+[^;]*\*\s*2|return\s+2\s*\*/, /\bdoubleNumber\s*\(\s*7\s*\)/, /println\s*\(/],
  "level2-recursion-intro": [/\bfactorial\s*\(\s*int\s+\w+\s*\)/, /\breturn\s+1\s*;/, /\breturn\s+[^;]*factorial\s*\([^)]*-\s*1/, /\bfactorial\s*\(\s*5\s*\)/],
  "level3-1-arrays-intro": [/\b(?:for|while)\s*\(/, /总步数/, /平均步数/, /\/\s*steps\.length/],
  "level3-2-two-dimensional-arrays": [/\b(?:for|while)\s*\([\s\S]*\b(?:for|while)\s*\(/, /平均温度/, /\/\s*[\w.[\]]+\.length/],
  "level3-3-list-intro": [/\.add\s*\(\s*"牛奶"\s*\)/, /\.add\s*\(\s*"面包"\s*\)/, /\.add\s*\(\s*"鸡蛋"\s*\)/, /\.set\s*\(\s*1\s*,\s*"全麦面包"\s*\)/, /\.remove\s*\(\s*(?:0|"牛奶")\s*\)/, /\.size\s*\(/],
  "level3-4-set-dedup": [/\bLinkedHashSet\b/, /(?:addAll|add)\s*\(|new\s+LinkedHashSet\s*<[^>]*>\s*\(\s*signups/, /\.size\s*\(/, /println\s*\(/],
  "level3-5-map-intro": [/\.put\s*\(\s*"苹果"\s*,\s*8\s*\)/, /\.put\s*\(\s*"香蕉"\s*,\s*5\s*\)/, /\.put\s*\(\s*"橙子"\s*,\s*3\s*\)/, /getOrDefault\s*\(\s*"梨"\s*,\s*0\s*\)/, /\.size\s*\(/],
  "level3-6-iteration-traversal": [/\.iterator\s*\(/, /\.hasNext\s*\(/, /\.next\s*\(/, /\.remove\s*\(\s*\)/, /通过人数/, /通过平均分/],
  "level3-7-sorting-comparator": [/\bsort\s*\(/, /(?:comparingInt|compare)\s*\([\s\S]*length/, /thenComparing\s*\(|compareTo\s*\(/],
  "level3-8-safe-read-boundaries": [/hasNextInt\s*\(/, /nextInt\s*\(/, /menu\s*\[\s*\w+\s*-\s*1\s*\]/, /请输入数字编号/, /没有这个选项/],
  "level4-1-classes-objects": [/\bclass\s+Pet\b/, /\bintroduce\s*\(\s*\)\s*\{[^}]*\bname\b[^}]*\btype\b/, /new\s+Pet\s*\(/, /\.introduce\s*\(/],
  "level4-2-fields-methods-constructors": [/\bCourse\s*\(\s*String\s+\w+\s*,\s*int\s+\w+\s*\)/, /\bthis\.\w+\s*=/, /printInfo\s*\(\s*\)\s*\{[^}]*println\s*\(/, /new\s+Course\s*\(\s*"Java 基础"\s*,\s*12\s*\)/],
  "level4-3-encapsulation": [/\bprivate\s+int\s+balance\b/, /\bdeposit\s*\(\s*int\s+\w+\s*\)\s*\{[^}]*\bif\s*\(/, /\bwithdraw\s*\(\s*int\s+\w+\s*\)\s*\{[^}]*\bif\s*\(/, /\bbalance\s*-=/],
  "level4-4-static-instance-members": [/\bstatic\s+int\s+total\b/, /\bCounter\s*\(\s*String\s+\w+\s*\)\s*\{[^}]*total\s*(?:\+\+|\+=\s*1)/, /(?:new\s+Counter\s*\([^)]*\)[\s\S]*){2}/],
  "level4-5-inheritance-polymorphism": [/\bCircle\s+extends\s+Shape\b/, /\bRectangle\s+extends\s+Shape\b/, /(?:@Override[\s\S]*?area\s*\([\s\S]*?){2}/, /\bShape\s*\[\s*\]/, /\.area\s*\(/],
  "level4-6-abstract-classes": [/\babstract\s+class\s+Message\b/, /\babstract\s+String\s+content\s*\(/, /\bEmailMessage\s+extends\s+Message\b/, /发送邮件给/, /\.print\s*\(/],
  "level4-7-interfaces": [/\binterface\s+Payable\b/, /\bCardPayment\s+implements\s+Payable\b/, /\bPayable\s+\w+\s*=\s*new\s+CardPayment/, /\.pay\s*\(\s*80\s*\)/],
  "level4-8-enums-state-modeling": [/\benum\s+TaskStatus\b/, /\bTODO\s*\(/, /\bDOING\s*\(/, /\bDONE\s*\(\s*"已完成"\s*\)/, /\bTaskStatus\.DONE\b/, /println\s*\(/],
  "level4-9-packages-access-control": [/\bprivate\s+String\s+owner\b/, /\bprivate\s+String\s+role\b/, /\bpublic\s+String\s+summary\s*\(/, /(?:^|[;{}])\s*boolean\s+sameRole\s*\(/, /\.summary\s*\(/],
  "level5-1-string-deep-dive": [/\.(?:trim|strip)\s*\(/, /\.contains\s*\(\s*"Spring"\s*\)/, /\.substring\s*\(/, /\.toLowerCase\s*\(/],
  "level5-2-string-builder": [/\bnew\s+StringBuilder\s*\(/, /\bfor\s*\(/, /\.append\s*\(/, /\.toString\s*\(/],
  "level5-3-math-random-bigdecimal": [/\bBigDecimal\b/, /\.multiply\s*\(/, /\.setScale\s*\(\s*2\b/, /Math\.max\s*\(/, /\.nextInt\s*\(\s*(?:6|1\s*,\s*7)\s*\)/],
  "level5-4-date-time-api": [/LocalDateTime\.of\s*\(/, /\.plusDays\s*\(\s*10\s*\)/, /yyyy-MM-dd HH:mm/, /ChronoUnit\.DAYS\.between\s*\(/],
  "level5-5-optional": [/Optional\s*<\s*String\s*>\s+findNickname/, /Optional\.of\s*\(\s*"ada"\s*\)/, /Optional\.empty\s*\(/, /\.map\s*\(/, /\.orElse\s*\(\s*"游客"\s*\)/],
  "level5-6-regular-expression": [/(?:matches|Pattern\.compile)\s*\([^;]+/, /(?:matches|Pattern\.compile)\s*\([^;]+;[\s\S]*(?:matches|Pattern\.compile)\s*\(/, /\[3-9\]/, /@/],
  "level5-7-exception-hierarchy": [/\bInvalidAgeException\s+extends\s+\w*Exception/, /parseInt\s*\(/, /throw\s+new\s+InvalidAgeException\s*\(/, /catch\s*\(\s*(?:NumberFormatException|InvalidAgeException)/, /注册失败/],
  "level5-8-logging-intro": [/Logger\.getLogger\s*\(/, /\.info\s*\(|Level\.INFO\b/, /\.warning\s*\(|Level\.WARNING\b/, /Level\.SEVERE\b/, /catch\s*\(/],
  "level6-1-generics": [/\bclass\s+Pair\s*<\s*K\s*,\s*V\s*>/, /\bPair\s*<\s*String\s*,\s*Integer\s*>/, /<\s*K\s*,\s*V\s*>\s+void\s+printPair\s*\(/, /->/],
  "level6-2-lambda-expressions": [/Function\s*<\s*Integer\s*,\s*Integer\s*>/, /\.apply\s*\(/, /->\s*Math\.min\s*\(/, /\+\s*5\b/],
  "level6-3-method-references": [/String\s*::\s*trim/, /String\s*::\s*toUpperCase/, /\.(?:collect|toList)\s*\(/, /println\s*\(|System\.out::println/],
  "level6-4-stream-basics": [/\.stream\s*\(/, /\.filter\s*\(/, /\.sorted\s*\(/, /\.map\s*\(/, /\.collect\s*\(/],
  "level6-5-stream-advanced": [/groupingBy\s*\(/, /counting\s*\(/, /summingInt\s*\(/, /\.flatMap\s*\(/, /toSet\s*\(/],
  "level6-6-record": [/\brecord\s+Book\s*\(\s*String\s+title,\s*String\s+author,\s*int\s+pages\s*\)/, /\bBook\s*\{/, /pages\s*<=\s*0|pages\s*<\s*1/, /\.isBlank\s*\(|\.isEmpty\s*\(/, /\.summary\s*\(/],
  "level6-7-sealed-class": [/\bsealed\s+interface\s+DeliveryStatus\b/, /\brecord\s+Preparing\b/, /\brecord\s+Shipping\b/, /\brecord\s+Delivered\b/, /\btext\s*\(/, /new\s+Shipping\s*\(/],
  "level6-8-pattern-matching": [/\bswitch\s*\(/, /\bcase\s+Success\s*\(/, /\bcase\s+Error\s*\([^)]*\)\s*when\b/, /\bcase\s+Loading\s*(?:\(|\w+\s*->)/, /服务器错误/, /请求错误/],
  "level6-9-module-system": [/\bmodule\s+com\.example\.shop\s*\{/, /\brequires\s+java\.logging\s*;/, /\bexports\s+com\.example\.shop\.api\s*;/, /\b(?:Logger|println)\s*\./, /\bmain\s*\(/],
  "level7-1-file-read-write": [/createDirectories\s*\(/, /study\.txt/, /Files\.writeString\s*\(/, /Files\.readString\s*\(/, /StandardCharsets\.UTF_8/, /今日主题：文件读写/],
  "level7-2-charsets-encoding": [/\.getBytes\s*\(\s*StandardCharsets\.UTF_8/, /new\s+String\s*\([^;]*StandardCharsets\.UTF_8/, /Files\.writeString\s*\(/, /Files\.readString\s*\(/],
  "level7-3-nio-basics": [/Files\.createTempDirectory\s*\(/, /\.resolve\s*\(\s*"reports"\s*\)/, /\.resolve\s*\(\s*"today-copy\.txt"\s*\)/, /Files\.copy\s*\(/, /try\s*\([^;]*Files\.list\s*\(/],
  "level7-4-json-processing": [/city/, /temperature/, /\bok\b/, /杭州/, /println\s*\([^;]*city\b/, /String\.format\s*\(|StringBuilder\b|\\?"city\\?"[\s\S]*\\?"temperature\\?"/],
  "level7-5-http-client": [/HttpClient\.(?:newHttpClient|newBuilder)\s*\(/, /https:\/\/example\.com\//, /\.send\s*\(/, /\.statusCode\s*\(/, /Content-Type/i, /substring\s*\(\s*0\s*,\s*80\s*\)|Math\.min\s*\(\s*80\b/],
  "level7-6-socket-intro": [/new\s+ServerSocket\s*\(/, /new\s+Socket\s*\(/, /\bPING\b/, /\bPONG\b/, /\.readLine\s*\(/, /StandardCharsets\.UTF_8/],
  "level8-1-debug": [/scores\.length\b/, />=\s*60\b|60\s*<=/, /及格人数/],
  "level8-2-junit-5-intro": [/@Test\b/, /assertEquals\s*\(\s*"A"\s*,[^;]*\b90\b/, /assertEquals\s*\(\s*"B"\s*,[^;]*\b75\b/, /assertEquals\s*\(\s*"C"\s*,[^;]*\b59\b/],
  "level8-3-assertions-boundaries": [/@Test\b/, /assertFalse\s*\([^;]*isValid\s*\(\s*null/, /assertFalse\s*\([^;]*isValid\s*\(\s*".{5}"\s*\)/, /assertTrue\s*\([^;]*isValid\s*\(\s*".{6}"\s*\)/, /assertTrue\s*\([^;]*isValid\s*\(\s*".{7,}"\s*\)/],
  "level8-4-maven-intro": [/<groupId>\s*com\.example\s*<\/groupId>/, /<artifactId>\s*toolbox\s*<\/artifactId>/, /<version>\s*1\.0-SNAPSHOT\s*<\/version>/, /<maven\.compiler\.release>\s*17\s*</, /<artifactId>\s*junit-jupiter\s*<\/artifactId>/, /<scope>\s*test\s*<\/scope>/],
  "level8-5-gradle-intro": [/\bapplication\b/, /\bmavenCentral\s*\(/, /\btestImplementation\b[^;\n]*junit-jupiter/, /\bmainClass\s*=\s*['"]Main['"]/, /\buseJUnitPlatform\s*\(/],
  "level8-6-code-style-formatting": [/\bstatic\s+final\s+int\s+PASS_SCORE\b/, /\bboolean\s+isPassed\s*\(/, /println\s*\(/],
  "level8-7-git-basics": [/^git\s+init\b/m, /^git\s+status\b/m, /^git\s+add\s+Main\.java\b/m, /^git\s+commit[^\n]*Add grade exercise/m, /^git\s+(?:switch\s+-c|checkout\s+-b)\s+test-boundary\b|^git\s+branch\s+test-boundary\s*\r?\n\s*git\s+switch\s+test-boundary\b/m, /^git\s+log[^\n]*--oneline\b/m],
  "level9-1-sql-intro": [/create\s+table\s+products\b/i, /insert\s+into\s+products\b[\s\S]*values/i, /select\s+name\s*,\s*price\s+from\s+products\b/i, /where\s+stock\s*>\s*0/i, /order\s+by\s+price\b/i],
  "level9-2-table-design": [/create\s+table\s+students\b/i, /create\s+table\s+courses\b/i, /create\s+table\s+enrollments\b/i, /references\s+students\b/i, /references\s+courses\b/i, /(?:unique|primary key)\s*(?:key\s*)?\(\s*student_id\s*,\s*course_id\s*\)/i],
  "level9-3-jdbc": [/select\s+id\s*,\s*username\s*,\s*city\s+from\s+users\b/i, /where\s+city\s*=\s*\?/i, /\bPreparedStatement\b/, /\.setString\s*\(\s*1\s*,\s*city\s*\)/, /\.executeQuery\s*\(/],
  "level9-4-connection-pool": [/new\s+HikariConfig\s*\(/, /\.setJdbcUrl\s*\(/, /\.setUsername\s*\(/, /\.setPassword\s*\(/, /\.setMaximumPoolSize\s*\(\s*5\s*\)/, /new\s+HikariDataSource\s*\(/, /count\s*\(\s*\*\s*\)\s+from\s+products/i],
  "level9-5-transactions": [/setAutoCommit\s*\(\s*false\s*\)/, /update\s+products\s+set\s+stock\b/i, /insert\s+into\s+orders\b/i, /\.commit\s*\(/, /\.rollback\s*\(/],
  "level9-6-dao-repository": [/\bfindById\s*\(\s*long\s+id\s*\)/, /\bPreparedStatement\b/, /\.setLong\s*\(/, /new\s+Product\s*\(/, /return\s+null\b/],
  "level9-7-pagination-search-sort": [/where\s+name\s+like\s*\?/i, /order\s+by\s+price\s+asc\s*,\s*id\s+asc/i, /limit\s+\?\s+offset\s+\?/i, /\(\s*(?:page|safePage)\s*-\s*1\s*\)\s*\*\s*(?:size|safeSize)/, /\.setInt\s*\(/],
  "level10-1-spring-boot-project-structure": [/\bpackage\s+com\.example\.demo\s*;/, /@SpringBootApplication\b/, /SpringApplication\.run\s*\(/, /@GetMapping\s*\(\s*"\/api\/ping"\s*\)/, /getProperty\s*\(\s*"app\.name"/, /name:\s*java-path\b/],
  "level10-2-controller": [/@RestController\b/, /@GetMapping\s*\([^)]*\{id\}/, /@PostMapping\b/, /@RequestBody\b/, /ResponseEntity\.created\s*\(/],
  "level10-3-service-layer": [/\bclass\s+\w*Controller\b/, /\bclass\s+EnrollmentService\b/, /\b(?:class|interface)\s+\w*Repository\b/, /\bremainingSeats\b/, /\bthrow\s+new\b|return\s+ResponseEntity/],
  "level10-4-validation": [/@NotBlank\b/, /@Size\s*\(\s*max\s*=\s*50\b/, /@Min\s*\(\s*(?:value\s*=\s*)?1\b/, /@Max\s*\(\s*(?:value\s*=\s*)?5\b/, /@Valid\s+@RequestBody|@RequestBody\s+@Valid/],
  "level10-5-global-exception-handling": [/\bclass\s+ApiException\b/, /@RestControllerAdvice\b|@ControllerAdvice\b/, /@ExceptionHandler\s*\(\s*ApiException\.class\s*\)/, /throw\s+new\s+ApiException\s*\([^)]*(?:NOT_FOUND|404)/],
  "level10-6-login-register": [/\bPasswordEncoder\b/, /\.encode\s*\(/, /\.matches\s*\(/, /\bHttpSession\b/, /\.setAttribute\s*\(\s*"(?:userId|LOGIN_USER_ID)"/],
  "level10-7-authorization": [/\/api\/admin\/\*\*/, /\.hasRole\s*\(\s*"ADMIN"/, /\.permitAll\s*\(/, /HttpMethod\.GET\b/, /\.anyRequest\s*\(\s*\)\s*\.authenticated\s*\(/],
  "level10-8-file-upload": [/@RequestParam\s*\(\s*"avatar"\s*\)/, /\.isEmpty\s*\(/, /image\/png|IMAGE_PNG_VALUE/, /UUID\.randomUUID\s*\(/, /(?:Files\.copy|transferTo)\s*\(/],
  "level10-9-api-docs": [/@(?:OpenAPIDefinition|Info)\b|new\s+OpenAPI\b/, /@Tag\b/, /@Operation\b/, /@ApiResponse[^\\n]*responseCode\s*=\s*"200"|responseCode\s*=\s*"200"/, /responseCode\s*=\s*"404"/],
  "level11-1-config-management": [/name:\s*order-service\b/, /port:\s*8080\b/, /on-profile:\s*dev\b/, /payment-mode:\s*fake\b/, /com\.example:\s*DEBUG\b/, /on-profile:\s*prod\b/, /payment-mode:\s*real\b/, /root:\s*WARN\b/],
  "level11-2-logging-troubleshooting": [/root:\s*INFO\b/, /com\.example\.orders:\s*DEBUG\b/, /LoggerFactory\.getLogger\s*\(/, /\.warn\s*\(/, /\.error\s*\(/],
  "level11-3-docker-intro": [/^FROM\s+eclipse-temurin:17-jre\b/m, /^WORKDIR\s+\/app\b/m, /^COPY\s+target\/order-service\.jar\s+app\.jar\b/m, /^EXPOSE\s+8080\b/m, /(?:ENTRYPOINT|CMD)[^\n]*java[^\n]*-jar[^\n]*app\.jar/, /^docker\s+build\b/m, /^docker\s+run\b/m],
  "level11-4-linux-deploy": [/^\[Service\]/m, /^User=app\s*$/m, /^WorkingDirectory=\/opt\/order-service\s*$/m, /^ExecStart=\/usr\/bin\/java -jar \/opt\/order-service\/app\.jar --spring\.profiles\.active=prod\s*$/m, /^Restart=on-failure\s*$/m, /systemctl\s+daemon-reload/, /systemctl\s+start\b/, /systemctl\s+status\b/, /journalctl\s+/],
  "level11-5-ci-cd-intro": [/name:\s*Java CI\b/, /push:/, /pull_request:/, /runs-on:\s*ubuntu-latest/, /actions\/checkout@/, /distribution:\s*temurin\b/, /java-version:\s*['"]?17\b/, /mvn\s+-B\s+test\b/, /mvn\s+-B\s+package\s+-DskipTests\b/],
  "level11-6-api-testing": [/\/actuator\/health\b/, /POST\b/i, /application\/json\b/i, /productId[^:\n]*:\s*1001\b/, /\bcount[^:\n]*:\s*2\b/, /\/orders\/1\b/],
  "level11-7-code-review": [/\bprivate\s+static\s+final\b/, /throw\s+new\s+IllegalArgumentException\s*\(/, /\breturn\b[^;]*(?:multiply|\*)/, /(?:discount|Discount)/],
  "level12-1-thread-basics": [/worker-A/, /worker-B/, /(?:\.start\s*\(\s*\)[\s\S]*?){2}/, /(?:\.join\s*\(\s*\)[\s\S]*?){2}main 收尾/],
  "level12-2-executor-service": [/newFixedThreadPool\s*\(\s*3\s*\)/, /\bCallable\s*<\s*Integer\s*>/, /\.submit\s*\(/, /(?:\+=|=\s*\w+\s*\+)[^;]*\.get\s*\(/, /\.shutdown\s*\(/],
  "level12-3-locks-and-synchronization": [/\bsynchronized\b/, /\b1000\b|1_000\b/, /(?:\.join\s*\(\s*\)[\s\S]*?){2}/, /计数/],
  "level12-4-concurrent-collections": [/\bConcurrentHashMap\b/, /\.merge\s*\(/, /(?:\.join\s*\(\s*\)[\s\S]*?){2}/, /Beijing/, /Shanghai/, /Hangzhou/],
  "level12-5-completable-future": [/\bCompletableFuture\b/, /\.supplyAsync\s*\(/, /\.thenCombine\s*\(/, /\.thenApply\s*\(/, /finally\s*\{[^}]*\.shutdown\s*\(/],
  "level12-6-virtual-threads": [/try\s*\([^;]*newVirtualThreadPerTaskExecutor\s*\(/, /\.submit\s*\(/, /\.isVirtual\s*\(/, /\.get\s*\(/],
  "level12-7-jvm-memory-areas": [/println\s*\([^;]*\bcount\b/, /println\s*\([^;]*box\.value\b/],
  "level12-8-gc-basics": [/\bfor\s*\(/, /new\s+byte\s*\[[^\]]+\]/, /\.add\s*\(/, /\.clear\s*\(/, /(?:\.size\s*\(\s*\)[\s\S]*?){2}/],
  "level12-9-jfr-diagnostics": [/ProcessHandle\.current\s*\(\s*\)\s*\.pid\s*\(/, /println\s*\([^;]*\bpid\b/, /Thread\.sleep\s*\(\s*(?:30_?000|30\s*\*\s*1_?000)\s*\)/],
  "level13-1-cli-accounting-book": [/accounts\.csv/, /\bcase\s*"1"|\.equals\s*\(\s*"1"\s*\)/, /\baddRecord\s*\(/, /\bprintRecords\s*\(/, /\bprintMonthlySummary\s*\(/, /Files\.readAllLines\s*\(/, /Files\.write\s*\(/],
  "level13-2-student-management-system": [/\bclass\s+Student\b/, /\bclass\s+StudentService\b/, /\.containsKey\s*\(|\.putIfAbsent\s*\(|findById\([^;]*\.isPresent\s*\(/, /\.put\s*\(|\.putIfAbsent\s*\(|students\.add\s*\(/, /findById\s*\(/, /\.(?:remove|removeIf)\s*\(/, /updateScore\s*\(/],
  "level13-3-contacts-csv-tool": [/contacts-raw\.csv/, /contacts-clean\.csv/, /Files\.readAllLines\s*\(/, /Files\.write\s*\(/, /\.putIfAbsent\s*\(|\.containsKey\s*\(/, /跳过无效行/],
  "level13-4-local-task-manager": [/\bclass\s+TaskService\b/, /\badd\s*\(/, /\bmarkDone\s*\(/, /\bdelete\s*\(/, /\bactiveTasks\s*\(/, /\boverdueTasks\s*\(/, /@Test\b/],
  "level13-5-blog-rest-api": [/articles/i, /(?:GET[\s\S]+POST|POST[\s\S]+GET)/, /PUT\b/i, /DELETE\b/i, /JPA\b/i, /\b(?:H2|MySQL)\b/i, /404\b/],
  "level13-6-admin-system": [/Spring Security|SecurityConfig|@PreAuthorize/i, /\bADMIN\b/, /\bUSER\b/, /审计/, /分页/, /禁用/, /403/],
  "level13-7-message-notification-system": [/(?:EmailSender|FakeSender)\b/, /\bSENT\b/, /\bFAILED\b/, /重试/, /\b3\b/, /异步|@Scheduled/],
  "level13-8-high-concurrency-task-processor": [/线程池|ThreadPoolExecutor/, /队列/, /状态/, /失败/, /统计/, /1_?000/],
  "level13-9-capstone-backend-service": [/README/i, /接口/, /数据库|数据模型/, /Dockerfile/i, /GitHub Actions|\.github\/workflows/i, /测试/, /负责人/, /通知/]
};

function unwrapStatementBlock(source) {
  return source.trim().replace(/^\{([\s\S]*)\}$/, "$1").trim();
}

// Check the output of simple counting loops without running arbitrary Java.
function printsEvenNumbersWithForLoop(source) {
  const main = /^(?:public\s+)?class\s+Main\s*\{\s*public\s+static\s+void\s+main\s*\(\s*String\s*(?:(?:\[\s*\]|\.\.\.)\s*(?<prefixParameter>[\w$]+)|(?<suffixParameter>[\w$]+)\s*\[\s*\])\s*\)\s*\{(?<mainBody>[\s\S]*)\}\s*\}$/.exec(source);
  if (!main) return false;
  const { prefixParameter, suffixParameter, mainBody } = main.groups;
  const parameter = prefixParameter ?? suffixParameter;
  const loop = /^for\s*\(\s*int\s+(?<counter>[A-Za-z_$][\w$]*)\s*=\s*(?<start>-?(?:0|[1-9]\d*))\s*;\s*(?:\k<counter>\s*(?<op><=?)\s*(?<bound>-?(?:0|[1-9]\d*))|(?<reversedBound>-?(?:0|[1-9]\d*))\s*(?<reversedOp>>=?)\s*\k<counter>)\s*;\s*(?:\+\+\s*\k<counter>|\k<counter>\s*\+\+|\k<counter>\s*(?:\+=|=\s*\k<counter>\s*\+)\s*(?<step>[1-9]\d*)|\k<counter>\s*=\s*(?<reversedStep>[1-9]\d*)\s*\+\s*\k<counter>)\s*\)\s*(?<body>[\s\S]+)$/.exec(mainBody.trim());
  if (!loop) return false;

  const { counter, start, op, bound, reversedOp, reversedBound, step, reversedStep, body } = loop.groups;
  if (counter === parameter) return false;
  const inclusive = (op ?? reversedOp).endsWith("=");
  const [initial, limit, increment] = [start, bound ?? reversedBound, step ?? reversedStep ?? "1"].map(Number);
  if (![initial, limit, increment].every((number) => (number | 0) === number)) return false;

  let statement = unwrapStatementBlock(body);
  const filter = /^if\s*\(\s*([A-Za-z_$][\w$]*)\s*%\s*2\s*==\s*0\s*\)\s*([\s\S]+)$/.exec(statement);
  if (filter) {
    if (filter[1] !== counter) return false;
    statement = unwrapStatementBlock(filter[2]);
  }
  const print = /^System\s*\.\s*out\s*\.\s*println\s*\(\s*(2\s*\*\s*)?([A-Za-z_$][\w$]*)(\s*\*\s*2)?\s*\)\s*;$/.exec(statement);
  if (!print || print[2] !== counter || (print[1] && print[3])) return false;

  const expected = [2, 4, 6, 8, 10];
  let printed = 0;
  let iterations = 0;
  for (let value = initial; inclusive ? value <= limit : value < limit; value = (value + increment) | 0) {
    if (++iterations > 32) return false;
    if (filter && value % 2 !== 0) continue;
    const output = print[1] || print[3] ? (value * 2) | 0 : value;
    if (output !== expected[printed++]) return false;
  }
  return printed === expected.length;
}

// Preserve quoted data while removing comments from the languages used in the exercises.
export function stripSourceComments(source) {
  return source.replace(/"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\/\*[\s\S]*?\*\/|(?<!:)\/\/[^\r\n]*|<!--[\s\S]*?-->|^[ \t]*(?:#(?=[ \t]|$)|--(?=[ \t]|$))[^\r\n]*/gm, (token) =>
    token.startsWith('"') || token.startsWith("'") ? token : token.replace(/[^\r\n]/g, " ")
  );
}

export function gradeJavaLesson(lesson, code) {
  const source = stripSourceComments(code).trim();
  const requirements = lessonRequirements[lesson.id];
  if (!source) return { ok: false, message: "请先填写本关答案。" };
  if (!requirements) return { ok: false, message: "本关验证规则尚未加载。" };
  if (/\bpublic\s+class\s+Main\b/.test(lesson.answerCode) &&
      (!/\bclass\s+Main\b/.test(source) || !/\bpublic\s+static\s+void\s+main\s*\(\s*String\s*(?:(?:\[\s*\]|\.\.\.)\s*[\w$]+|[\w$]+\s*\[\s*\])\s*\)/.test(source))) {
    return { ok: false, message: "请保留 Main 类和完整的 Java 入口方法。" };
  }
  if (!requirements.every((rule) => typeof rule === "function" ? rule(source) : rule.test(source))) {
    return { ok: false, message: "还有任务要求未满足。请对照本关检查项核对答案。" };
  }
  return { ok: true };
}
