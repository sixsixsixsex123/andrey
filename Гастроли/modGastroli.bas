Attribute VB_Name = "modGastroli"
Option Compare Database
Option Explicit

' ================================================================
'  БД «Гастроли» (вариант 12) - создание экранных форм (лаб. №3)
'  Запуск: поставить курсор внутрь процедуры CreateGastroliForms
'  и нажать F5. Формы пересоздаются заново при каждом запуске.
' ================================================================

Private Const LBL_W As Long = 2600   ' ширина подписи, твипы
Private Const ROW_H As Long = 340
Private Const ROW_STEP As Long = 420

Public Sub CreateGastroliForms()
    DropForm "Главное меню"
    DropForm "Театральные труппы"
    DropForm "Концертные залы"
    DropForm "Выступления"
    DropForm "Выступления труппы (подчинённая)"
    DropForm "Афиша зала (подчинённая)"
    DropForm "Категории мест (подчинённая)"

    BuildSubTroupeShows
    BuildSubHallShows
    BuildSubCategories
    BuildFormTroupes
    BuildFormHalls
    BuildFormShows
    BuildMainMenu

    SetStartupForm "Главное меню"
    MsgBox "Формы созданы. Главное меню будет открываться при запуске базы.", vbInformation, "Гастроли"
    DoCmd.OpenForm "Главное меню"
End Sub

' ---------------------------------------------------------------- служебные

Private Sub DropForm(ByVal nm As String)
    Dim ao As AccessObject
    For Each ao In CurrentProject.AllForms
        If ao.Name = nm Then
            If ao.IsLoaded Then DoCmd.Close acForm, nm, acSaveNo
            DoCmd.DeleteObject acForm, nm
            Exit Sub
        End If
    Next
End Sub

Private Sub SaveAs(frm As Form, ByVal nm As String)
    Dim tmp As String
    tmp = frm.Name
    DoCmd.Close acForm, tmp, acSaveYes
    DoCmd.Rename nm, acForm, tmp
End Sub

Private Function AddField(frm As Form, ByVal fld As String, ByVal cap As String, _
                          ByVal x As Long, ByVal y As Long, ByVal w As Long) As Control
    Dim c As Control, l As Control
    Set c = CreateControl(frm.Name, acTextBox, acDetail, , fld, x + LBL_W, y, w, ROW_H)
    c.Name = "txt" & fld
    Set l = CreateControl(frm.Name, acLabel, acDetail, c.Name, cap, x, y, LBL_W - 100, ROW_H)
    l.Name = "lbl" & fld
    Set AddField = c
End Function

Private Function AddCombo(frm As Form, ByVal fld As String, ByVal cap As String, _
                          ByVal x As Long, ByVal y As Long, ByVal w As Long, _
                          ByVal rowSrc As String, ByVal cols As Integer, ByVal widths As String) As Control
    Dim c As Control, l As Control
    Set c = CreateControl(frm.Name, acComboBox, acDetail, , fld, x + LBL_W, y, w, ROW_H)
    c.Name = "cbo" & fld
    c.RowSourceType = "Table/Query"
    c.RowSource = rowSrc
    c.ColumnCount = cols
    c.ColumnWidths = widths
    c.BoundColumn = 1
    c.LimitToList = True
    c.ListWidth = 5800
    Set l = CreateControl(frm.Name, acLabel, acDetail, c.Name, cap, x, y, LBL_W - 100, ROW_H)
    l.Name = "lbl" & fld
    Set AddCombo = c
End Function

' столбец табличной (подчинённой) формы: заголовок столбца = имя элемента
Private Sub AddColumn(frm As Form, ByVal fld As String, ByVal header As String, ByVal i As Integer)
    Dim c As Control
    Set c = CreateControl(frm.Name, acTextBox, acDetail, , fld, 100, 100 + i * ROW_STEP, 2000, ROW_H)
    c.Name = header
End Sub

Private Function AddButton(frm As Form, ByVal nm As String, ByVal cap As String, _
                           ByVal x As Long, ByVal y As Long, ByVal w As Long, ByVal h As Long) As Control
    Dim b As Control
    Set b = CreateControl(frm.Name, acCommandButton, acDetail, , , x, y, w, h)
    b.Name = nm
    b.Caption = cap
    b.OnClick = "[Event Procedure]"
    Set AddButton = b
End Function

Private Function AddTitle(frm As Form, ByVal txt As String, ByVal w As Long) As Control
    Dim t As Control
    Set t = CreateControl(frm.Name, acLabel, acDetail, , txt, 200, 100, w, 480)
    t.FontSize = 16
    t.FontBold = True
    t.Name = "lblTitle"
    Set AddTitle = t
End Function

Private Sub SetModule(frm As Form, ByVal code As String)
    frm.HasModule = True
    frm.Module.AddFromString code
End Sub

Private Function NavCode() As String
    NavCode = _
        "Private Sub cmdPrev_Click()" & vbCrLf & _
        "    On Error Resume Next" & vbCrLf & _
        "    DoCmd.GoToRecord , , acPrevious" & vbCrLf & _
        "End Sub" & vbCrLf & vbCrLf & _
        "Private Sub cmdNext_Click()" & vbCrLf & _
        "    On Error Resume Next" & vbCrLf & _
        "    DoCmd.GoToRecord , , acNext" & vbCrLf & _
        "End Sub" & vbCrLf & vbCrLf & _
        "Private Sub cmdNew_Click()" & vbCrLf & _
        "    On Error Resume Next" & vbCrLf & _
        "    DoCmd.GoToRecord , , acNewRec" & vbCrLf & _
        "End Sub" & vbCrLf & vbCrLf & _
        "Private Sub cmdDelete_Click()" & vbCrLf & _
        "    On Error Resume Next" & vbCrLf & _
        "    If MsgBox(""Удалить текущую запись?"", vbYesNo + vbQuestion) = vbYes Then DoCmd.RunCommand acCmdDeleteRecord" & vbCrLf & _
        "End Sub" & vbCrLf & vbCrLf & _
        "Private Sub cmdMenu_Click()" & vbCrLf & _
        "    DoCmd.Close acForm, Me.Name" & vbCrLf & _
        "    DoCmd.OpenForm ""Главное меню""" & vbCrLf & _
        "End Sub" & vbCrLf
End Function

Private Sub AddNavButtons(frm As Form, ByVal y As Long)
    AddButton frm, "cmdPrev", "< Предыдущая", 200, y, 1700, 450
    AddButton frm, "cmdNext", "Следующая >", 2000, y, 1700, 450
    AddButton frm, "cmdNew", "Новая запись", 3800, y, 1700, 450
    AddButton frm, "cmdDelete", "Удалить", 5600, y, 1500, 450
    AddButton frm, "cmdMenu", "В главное меню", 7200, y, 2000, 450
End Sub

Private Sub SetupSingle(frm As Form, ByVal src As String, ByVal cap As String)
    frm.RecordSource = src
    frm.Caption = cap
    frm.DefaultView = 0          ' одиночная форма
    frm.RecordSelectors = False
    frm.NavigationButtons = True
    frm.DividingLines = False
    frm.AutoCenter = True
    frm.ScrollBars = 0
    frm.Width = 11500
End Sub

Private Sub SetupDatasheet(frm As Form, ByVal src As String, ByVal allowEdit As Boolean)
    frm.RecordSource = src
    frm.DefaultView = 2          ' таблица
    frm.AllowFormView = False
    frm.AllowEdits = allowEdit
    frm.AllowAdditions = allowEdit
    frm.AllowDeletions = allowEdit
End Sub

' ---------------------------------------------------------------- подчинённые формы

Private Sub BuildSubTroupeShows()
    Dim frm As Form
    Set frm = CreateForm()
    SetupDatasheet frm, "Форма_Выступления труппы", False
    AddColumn frm, "ШифрТруппы", "Шифр труппы", 0
    AddColumn frm, "Дата", "Дата", 1
    AddColumn frm, "Время", "Время", 2
    AddColumn frm, "НазваниеСпектакля", "Спектакль", 3
    AddColumn frm, "Город", "Город", 4
    AddColumn frm, "Адрес", "Адрес зала", 5
    AddColumn frm, "ПроданоБилетов", "Продано билетов", 6
    frm.Controls("Шифр труппы").ColumnHidden = True
    SaveAs frm, "Выступления труппы (подчинённая)"
End Sub

Private Sub BuildSubHallShows()
    Dim frm As Form
    Set frm = CreateForm()
    SetupDatasheet frm, "Форма_Афиша зала", False
    AddColumn frm, "ШифрЗала", "Шифр зала", 0
    AddColumn frm, "Дата", "Дата", 1
    AddColumn frm, "Время", "Время", 2
    AddColumn frm, "НазваниеТеатра", "Театр", 3
    AddColumn frm, "НазваниеСпектакля", "Спектакль", 4
    AddColumn frm, "ПроданоБилетов", "Продано билетов", 5
    frm.Controls("Шифр зала").ColumnHidden = True
    SaveAs frm, "Афиша зала (подчинённая)"
End Sub

Private Sub BuildSubCategories()
    Dim frm As Form
    Set frm = CreateForm()
    SetupDatasheet frm, "КатегорииМест", True
    AddColumn frm, "ШифрЗала", "Шифр зала", 0
    AddColumn frm, "КатегорияМест", "Категория мест", 1
    AddColumn frm, "РядС", "Ряд с", 2
    AddColumn frm, "РядПо", "Ряд по", 3
    AddColumn frm, "Коэффициент", "Коэффициент", 4
    ' вычисляемая цена билета: базовая цена зала * коэффициент
    Dim c As Control
    Set c = CreateControl(frm.Name, acTextBox, acDetail, , _
        "=CCur(Nz(DLookUp(""СтоимостьБилета"",""КонцертныеЗалы"",""ШифрЗала='"" & [ШифрЗала] & ""'""),0)*Nz([Коэффициент],0))", _
        100, 100 + 5 * ROW_STEP, 2000, ROW_H)
    c.Name = "Цена билета"
    c.Format = "Currency"
    frm.Controls("Шифр зала").ColumnHidden = True
    SaveAs frm, "Категории мест (подчинённая)"
End Sub

' ---------------------------------------------------------------- основные формы

Private Sub BuildFormTroupes()
    Dim frm As Form, c As Control, y As Long
    Set frm = CreateForm()
    SetupSingle frm, "ТеатральныеТруппы", "Театральные труппы"
    AddTitle frm, "Театральные труппы", 8000
    y = 800
    AddField frm, "ШифрТруппы", "Шифр труппы", 200, y, 1200: y = y + ROW_STEP
    AddField frm, "НазваниеТеатра", "Название театра", 200, y, 4300: y = y + ROW_STEP
    AddField frm, "Город", "Город", 200, y, 2500: y = y + ROW_STEP
    AddField frm, "КоличествоЧеловек", "Количество человек", 200, y, 1200: y = y + ROW_STEP
    AddField frm, "КоличествоСпектаклей", "Количество спектаклей", 200, y, 1200: y = y + ROW_STEP
    AddField frm, "Постер", "Файл постера", 200, y, 2500: y = y + ROW_STEP

    ' постер: картинка из папки рядом с базой (путь хранится в поле Постер)
    Set c = CreateControl(frm.Name, acImage, acDetail, , , 7600, 800, 2300, 3200)
    c.Name = "imgPoster"
    c.SizeMode = 3                ' по размеру (zoom)
    On Error Resume Next
    c.ControlSource = "=IIf(IsNull([Постер]),Null,[CurrentProject].[Path] & ""\"" & [Постер])"
    On Error GoTo 0

    y = 4100
    Set c = CreateControl(frm.Name, acLabel, acDetail, , "Выступления труппы на гастролях:", 200, y, 5000, ROW_H)
    c.FontBold = True
    Set c = CreateControl(frm.Name, acSubform, acDetail, , , 200, y + 380, 11000, 2700)
    c.Name = "subShows"
    c.SourceObject = "Form.Выступления труппы (подчинённая)"
    c.LinkMasterFields = "ШифрТруппы"
    c.LinkChildFields = "ШифрТруппы"

    AddNavButtons frm, y + 3250
    frm.Section(acDetail).Height = y + 3900
    SetModule frm, NavCode()
    SaveAs frm, "Театральные труппы"
End Sub

Private Sub BuildFormHalls()
    Dim frm As Form, c As Control, y As Long
    Set frm = CreateForm()
    SetupSingle frm, "КонцертныеЗалы", "Концертные залы"
    AddTitle frm, "Концертные залы", 8000
    y = 800
    AddField frm, "ШифрЗала", "Шифр зала", 200, y, 1200: y = y + ROW_STEP
    AddField frm, "Город", "Город", 200, y, 2500: y = y + ROW_STEP
    AddField frm, "Адрес", "Адрес", 200, y, 4300: y = y + ROW_STEP
    AddField frm, "КоличествоМест", "Количество мест", 200, y, 1200: y = y + ROW_STEP
    Set c = AddField(frm, "СтоимостьБилета", "Стоимость билета", 200, y, 1600): y = y + ROW_STEP
    c.Format = "Currency"

    y = y + 150
    Set c = CreateControl(frm.Name, acLabel, acDetail, , "Стоимость билета по категориям мест:", 200, y, 5000, ROW_H)
    c.FontBold = True
    Set c = CreateControl(frm.Name, acSubform, acDetail, , , 200, y + 380, 11000, 2000)
    c.Name = "subCategories"
    c.SourceObject = "Form.Категории мест (подчинённая)"
    c.LinkMasterFields = "ШифрЗала"
    c.LinkChildFields = "ШифрЗала"

    y = y + 2550
    Set c = CreateControl(frm.Name, acLabel, acDetail, , "Афиша зала:", 200, y, 5000, ROW_H)
    c.FontBold = True
    Set c = CreateControl(frm.Name, acSubform, acDetail, , , 200, y + 380, 11000, 2200)
    c.Name = "subShows"
    c.SourceObject = "Form.Афиша зала (подчинённая)"
    c.LinkMasterFields = "ШифрЗала"
    c.LinkChildFields = "ШифрЗала"

    AddNavButtons frm, y + 2750
    frm.Section(acDetail).Height = y + 3400
    SetModule frm, NavCode()
    SaveAs frm, "Концертные залы"
End Sub

Private Sub BuildFormShows()
    Dim frm As Form, c As Control, y As Long
    Set frm = CreateForm()
    SetupSingle frm, "Выступления", "Выступления"
    AddTitle frm, "Выступления", 8000
    y = 800
    AddCombo frm, "ШифрТруппы", "Театральная труппа", 200, y, 4300, _
        "SELECT ШифрТруппы, НазваниеТеатра FROM ТеатральныеТруппы ORDER BY ШифрТруппы;", 2, "850;3400": y = y + ROW_STEP
    AddCombo frm, "ШифрЗала", "Концертный зал", 200, y, 4300, _
        "SELECT ШифрЗала, Город, Адрес FROM КонцертныеЗалы ORDER BY ШифрЗала;", 3, "850;1900;3000": y = y + ROW_STEP
    AddField frm, "НазваниеСпектакля", "Название спектакля", 200, y, 4300: y = y + ROW_STEP
    Set c = AddField(frm, "Дата", "Дата", 200, y, 1600): y = y + ROW_STEP
    c.Format = "Short Date"
    Set c = AddField(frm, "Время", "Время", 200, y, 1600): y = y + ROW_STEP
    c.Format = "Short Time"
    AddField frm, "ПроданоБилетов", "Продано билетов", 200, y, 1200: y = y + ROW_STEP

    ' вычисляемые поля
    Set c = AddField(frm, "Свободно", "Свободных мест", 200, y, 1200): y = y + ROW_STEP
    c.ControlSource = "=DLookUp(""КоличествоМест"",""КонцертныеЗалы"",""ШифрЗала='"" & [ШифрЗала] & ""'"")-[ПроданоБилетов]"
    c.Locked = True
    c.BackColor = RGB(240, 240, 240)
    Set c = AddField(frm, "Выручка", "Выручка", 200, y, 1600): y = y + ROW_STEP
    c.ControlSource = "=[ПроданоБилетов]*DLookUp(""СтоимостьБилета"",""КонцертныеЗалы"",""ШифрЗала='"" & [ШифрЗала] & ""'"")"
    c.Format = "Currency"
    c.Locked = True
    c.BackColor = RGB(240, 240, 240)

    AddNavButtons frm, y + 300
    frm.Section(acDetail).Height = y + 1000
    SetModule frm, NavCode()
    SaveAs frm, "Выступления"
End Sub

' ---------------------------------------------------------------- кнопочная форма

Private Sub BuildMainMenu()
    Dim frm As Form, c As Control, y As Long
    Set frm = CreateForm()
    frm.Caption = "Гастроли - главное меню"
    frm.RecordSelectors = False
    frm.NavigationButtons = False
    frm.DividingLines = False
    frm.ScrollBars = 0
    frm.AutoCenter = True
    frm.PopUp = False
    frm.Width = 6400

    Set c = CreateControl(frm.Name, acLabel, acDetail, , "БД «Гастроли»", 400, 250, 5600, 600)
    c.FontSize = 20
    c.FontBold = True
    c.TextAlign = 2
    Set c = CreateControl(frm.Name, acLabel, acDetail, , "Главное меню", 400, 850, 5600, 400)
    c.FontSize = 12
    c.TextAlign = 2

    y = 1500
    AddButton frm, "cmdTroupes", "Театральные труппы", 1200, y, 4000, 550: y = y + 700
    AddButton frm, "cmdHalls", "Концертные залы", 1200, y, 4000, 550: y = y + 700
    AddButton frm, "cmdShows", "Выступления", 1200, y, 4000, 550: y = y + 700
    AddButton frm, "cmdTotals", "Итоги гастролей по труппам", 1200, y, 4000, 550: y = y + 700
    AddButton frm, "cmdPrices", "Стоимость билета по категориям", 1200, y, 4000, 550: y = y + 700
    AddButton frm, "cmdExit", "Выход", 1200, y, 4000, 550: y = y + 700
    frm.Section(acDetail).Height = y + 300

    SetModule frm, _
        "Private Sub OpenAndClose(ByVal f As String)" & vbCrLf & _
        "    DoCmd.Close acForm, Me.Name" & vbCrLf & _
        "    DoCmd.OpenForm f" & vbCrLf & _
        "End Sub" & vbCrLf & vbCrLf & _
        "Private Sub cmdTroupes_Click()" & vbCrLf & "    OpenAndClose ""Театральные труппы""" & vbCrLf & "End Sub" & vbCrLf & vbCrLf & _
        "Private Sub cmdHalls_Click()" & vbCrLf & "    OpenAndClose ""Концертные залы""" & vbCrLf & "End Sub" & vbCrLf & vbCrLf & _
        "Private Sub cmdShows_Click()" & vbCrLf & "    OpenAndClose ""Выступления""" & vbCrLf & "End Sub" & vbCrLf & vbCrLf & _
        "Private Sub cmdTotals_Click()" & vbCrLf & "    DoCmd.OpenQuery ""10 Итоги гастролей по труппам""" & vbCrLf & "End Sub" & vbCrLf & vbCrLf & _
        "Private Sub cmdPrices_Click()" & vbCrLf & "    DoCmd.OpenQuery ""15 Стоимость билета по категориям мест""" & vbCrLf & "End Sub" & vbCrLf & vbCrLf & _
        "Private Sub cmdExit_Click()" & vbCrLf & "    If MsgBox(""Выйти из приложения?"", vbYesNo + vbQuestion) = vbYes Then DoCmd.Quit acQuitSaveAll" & vbCrLf & "End Sub" & vbCrLf

    SaveAs frm, "Главное меню"
End Sub

Private Sub SetStartupForm(ByVal nm As String)
    Dim db As DAO.Database
    Set db = CurrentDb
    On Error Resume Next
    db.Properties("StartupForm") = nm
    If Err.Number <> 0 Then
        Err.Clear
        db.Properties.Append db.CreateProperty("StartupForm", dbText, nm)
    End If
End Sub

' ---------------------------------------------------------------- запасной вариант
' Пересоздаёт все запросы лаб. №2 из SQL (на случай, если какой-то запрос был испорчен).
Public Sub RecreateGastroliQueries()
    Dim db As DAO.Database, s As String
    Set db = CurrentDb
    s = ""
    s = s & "PARAMETERS [Введите город] Text; " & vbCrLf
    s = s & "SELECT ШифрТруппы, НазваниеТеатра, КоличествоЧеловек, КоличествоСпектаклей " & vbCrLf
    s = s & "FROM [ТеатральныеТруппы] " & vbCrLf
    s = s & "WHERE Город = [Введите город] " & vbCrLf
    s = s & "ORDER BY НазваниеТеатра; " & vbCrLf
    MakeQuery db, "01 Труппы из города", s
    s = ""
    s = s & "PARAMETERS [Введите город] Text; " & vbCrLf
    s = s & "SELECT ШифрЗала, Адрес, КоличествоМест, СтоимостьБилета " & vbCrLf
    s = s & "FROM [КонцертныеЗалы] " & vbCrLf
    s = s & "WHERE Город = [Введите город] " & vbCrLf
    s = s & "ORDER BY КоличествоМест DESC; " & vbCrLf
    MakeQuery db, "02 Концертные залы города", s
    s = ""
    s = s & "PARAMETERS [Введите шифр труппы] Text; " & vbCrLf
    s = s & "SELECT В.НазваниеСпектакля, В.Дата, В.Время, З.Город, З.Адрес " & vbCrLf
    s = s & "FROM [Выступления] AS [В] INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "WHERE В.ШифрТруппы = [Введите шифр труппы] " & vbCrLf
    s = s & "ORDER BY В.Дата, В.Время; " & vbCrLf
    MakeQuery db, "03 Гастрольный график труппы", s
    s = ""
    s = s & "PARAMETERS [Введите шифр зала] Text, [Начальная дата] DateTime, [Конечная дата] DateTime; " & vbCrLf
    s = s & "SELECT В.Дата, В.Время, Т.НазваниеТеатра, В.НазваниеСпектакля " & vbCrLf
    s = s & "FROM [Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы " & vbCrLf
    s = s & "WHERE В.ШифрЗала = [Введите шифр зала] AND В.Дата Between [Начальная дата] And [Конечная дата] " & vbCrLf
    s = s & "ORDER BY В.Дата, В.Время; " & vbCrLf
    MakeQuery db, "04 Афиша зала за период", s
    s = ""
    s = s & "PARAMETERS [Введите город] Text; " & vbCrLf
    s = s & "SELECT В.Дата, В.Время, В.НазваниеСпектакля, Т.НазваниеТеатра, З.Адрес " & vbCrLf
    s = s & "FROM ([Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы) INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "WHERE З.Город = [Введите город] " & vbCrLf
    s = s & "ORDER BY В.Дата, В.Время; " & vbCrLf
    MakeQuery db, "05 Спектакли в городе", s
    s = ""
    s = s & "PARAMETERS [Введите название спектакля] Text; " & vbCrLf
    s = s & "SELECT В.НазваниеСпектакля, Т.НазваниеТеатра, З.Город, В.Дата, В.Время " & vbCrLf
    s = s & "FROM ([Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы) INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "WHERE В.НазваниеСпектакля Like ""*"" & [Введите название спектакля] & ""*"" " & vbCrLf
    s = s & "ORDER BY В.Дата; " & vbCrLf
    MakeQuery db, "06 Где идёт спектакль", s
    s = ""
    s = s & "PARAMETERS [Введите минимальное количество мест] Long; " & vbCrLf
    s = s & "SELECT ШифрЗала, Город, Адрес, КоличествоМест " & vbCrLf
    s = s & "FROM [КонцертныеЗалы] " & vbCrLf
    s = s & "WHERE КоличествоМест >= [Введите минимальное количество мест] " & vbCrLf
    s = s & "ORDER BY КоличествоМест DESC; " & vbCrLf
    MakeQuery db, "07 Залы вместимостью не менее", s
    s = ""
    s = s & "SELECT Т.НазваниеТеатра, В.НазваниеСпектакля, З.Город, В.Дата, В.ПроданоБилетов, З.СтоимостьБилета, [В].[ПроданоБилетов]*[З].[СтоимостьБилета] AS [Выручка] " & vbCrLf
    s = s & "FROM ([Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы) INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "ORDER BY В.Дата; " & vbCrLf
    MakeQuery db, "08 Выручка от выступлений", s
    s = ""
    s = s & "SELECT З.Город, В.НазваниеСпектакля, В.Дата, З.КоличествоМест, В.ПроданоБилетов, [З].[КоличествоМест]-[В].[ПроданоБилетов] AS [Свободных мест], Round([В].[ПроданоБилетов]/[З].[КоличествоМест]*100,1) AS [Заполняемость в процентах] " & vbCrLf
    s = s & "FROM [Выступления] AS [В] INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "ORDER BY Round([В].[ПроданоБилетов]/[З].[КоличествоМест]*100,1) DESC; " & vbCrLf
    MakeQuery db, "09 Заполняемость залов", s
    s = ""
    s = s & "SELECT Т.НазваниеТеатра, Count(В.НазваниеСпектакля) AS [Число выступлений], Sum(В.ПроданоБилетов) AS [Продано билетов], Sum([В].[ПроданоБилетов]*[З].[СтоимостьБилета]) AS [Выручка] " & vbCrLf
    s = s & "FROM ([Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы) INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "GROUP BY Т.НазваниеТеатра " & vbCrLf
    s = s & "ORDER BY Sum([В].[ПроданоБилетов]*[З].[СтоимостьБилета]) DESC; " & vbCrLf
    MakeQuery db, "10 Итоги гастролей по труппам", s
    s = ""
    s = s & "SELECT З.ШифрЗала, З.Город, Count(В.Дата) AS [Число выступлений], Avg(В.ПроданоБилетов) AS [В среднем продано], Max(В.ПроданоБилетов) AS [Максимум продано], Min(В.ПроданоБилетов) AS [Минимум продано] " & vbCrLf
    s = s & "FROM [КонцертныеЗалы] AS [З] INNER JOIN [Выступления] AS [В] ON З.ШифрЗала = В.ШифрЗала " & vbCrLf
    s = s & "GROUP BY З.ШифрЗала, З.Город; " & vbCrLf
    MakeQuery db, "11 Статистика по залам", s
    s = ""
    s = s & "SELECT TOP 5 Т.НазваниеТеатра, В.НазваниеСпектакля, З.Город, В.Дата, В.ПроданоБилетов " & vbCrLf
    s = s & "FROM ([Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы) INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "ORDER BY В.ПроданоБилетов DESC; " & vbCrLf
    MakeQuery db, "12 Пять самых посещаемых выступлений", s
    s = ""
    s = s & "PARAMETERS [Введите порог заполняемости в процентах] IEEEDouble; " & vbCrLf
    s = s & "SELECT Т.НазваниеТеатра, В.НазваниеСпектакля, З.Город, В.Дата, Round([В].[ПроданоБилетов]/[З].[КоличествоМест]*100,1) AS [Заполняемость в процентах] " & vbCrLf
    s = s & "FROM ([Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы) INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "WHERE [В].[ПроданоБилетов]/[З].[КоличествоМест]*100 < [Введите порог заполняемости в процентах] " & vbCrLf
    s = s & "ORDER BY В.Дата; " & vbCrLf
    MakeQuery db, "13 Выступления с низкой заполняемостью", s
    s = ""
    s = s & "SELECT DISTINCT Т.НазваниеТеатра, Т.Город AS [Город труппы], З.Город AS [Город гастролей] " & vbCrLf
    s = s & "FROM ([Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы) INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "WHERE Т.Город <> З.Город " & vbCrLf
    s = s & "ORDER BY Т.НазваниеТеатра; " & vbCrLf
    MakeQuery db, "14 Гастроли вне родного города", s
    s = ""
    s = s & "PARAMETERS [Введите шифр зала] Text; " & vbCrLf
    s = s & "SELECT З.Город, З.Адрес, К.КатегорияМест, К.РядС, К.РядПо, З.СтоимостьБилета AS [Базовая стоимость], К.Коэффициент, CCur([З].[СтоимостьБилета]*[К].[Коэффициент]) AS [Стоимость билета] " & vbCrLf
    s = s & "FROM [КонцертныеЗалы] AS [З] INNER JOIN [КатегорииМест] AS [К] ON З.ШифрЗала = К.ШифрЗала " & vbCrLf
    s = s & "WHERE З.ШифрЗала = [Введите шифр зала] " & vbCrLf
    s = s & "ORDER BY К.Коэффициент DESC; " & vbCrLf
    MakeQuery db, "15 Стоимость билета по категориям мест", s
    s = ""
    s = s & "SELECT Город, Count(ШифрЗала) AS [Число залов], Sum(КоличествоМест) AS [Всего мест], Avg(СтоимостьБилета) AS [Средняя стоимость билета] " & vbCrLf
    s = s & "FROM [КонцертныеЗалы] " & vbCrLf
    s = s & "GROUP BY Город " & vbCrLf
    s = s & "ORDER BY Город; " & vbCrLf
    MakeQuery db, "16 Залы по городам", s
    s = ""
    s = s & "TRANSFORM Sum(В.ПроданоБилетов) AS [Продано] " & vbCrLf
    s = s & "SELECT Т.НазваниеТеатра AS [Труппа] " & vbCrLf
    s = s & "FROM ([Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы) INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "GROUP BY Т.НазваниеТеатра " & vbCrLf
    s = s & "PIVOT З.Город; " & vbCrLf
    MakeQuery db, "17 Перекрёстный - билеты по городам", s
    s = ""
    s = s & "TRANSFORM Count(В.НазваниеСпектакля) AS [Выступлений] " & vbCrLf
    s = s & "SELECT Т.НазваниеТеатра AS [Труппа] " & vbCrLf
    s = s & "FROM [ТеатральныеТруппы] AS [Т] INNER JOIN [Выступления] AS [В] ON Т.ШифрТруппы = В.ШифрТруппы " & vbCrLf
    s = s & "GROUP BY Т.НазваниеТеатра " & vbCrLf
    s = s & "PIVOT Format(В.Дата,""yyyy-mm""); " & vbCrLf
    MakeQuery db, "18 Перекрёстный - выступления по месяцам", s
    s = ""
    s = s & "PARAMETERS [Введите минимальное число выступлений] Long; " & vbCrLf
    s = s & "SELECT Т.ШифрТруппы, Т.НазваниеТеатра, Count(В.ШифрЗала) AS [Число выступлений] " & vbCrLf
    s = s & "FROM [ТеатральныеТруппы] AS [Т] INNER JOIN [Выступления] AS [В] ON Т.ШифрТруппы = В.ШифрТруппы " & vbCrLf
    s = s & "GROUP BY Т.ШифрТруппы, Т.НазваниеТеатра " & vbCrLf
    s = s & "HAVING Count(В.ШифрЗала) >= [Введите минимальное число выступлений] " & vbCrLf
    s = s & "ORDER BY Count(В.ШифрЗала) DESC; " & vbCrLf
    MakeQuery db, "19 Труппы с числом выступлений не менее", s
    s = ""
    s = s & "SELECT В.Дата, В.Время, З.Город, Т.НазваниеТеатра, В.НазваниеСпектакля, DateDiff(""d"",Date(),[В].[Дата]) AS [Дней до начала] " & vbCrLf
    s = s & "FROM ([Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы) INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "WHERE В.Дата >= Date() " & vbCrLf
    s = s & "ORDER BY В.Дата, В.Время; " & vbCrLf
    MakeQuery db, "20 Предстоящие выступления", s
    s = ""
    s = s & "PARAMETERS [Введите шифр зала] Text, [Введите новую стоимость билета] Currency; " & vbCrLf
    s = s & "UPDATE [КонцертныеЗалы] " & vbCrLf
    s = s & "SET [СтоимостьБилета] = [Введите новую стоимость билета] " & vbCrLf
    s = s & "WHERE ШифрЗала = [Введите шифр зала]; " & vbCrLf
    MakeQuery db, "21 Изменение стоимости билета", s
    s = ""
    s = s & "PARAMETERS [Введите город] Text, [Введите процент повышения] IEEEDouble; " & vbCrLf
    s = s & "UPDATE [КонцертныеЗалы] " & vbCrLf
    s = s & "SET [СтоимостьБилета] = [СтоимостьБилета]*(1+[Введите процент повышения]/100) " & vbCrLf
    s = s & "WHERE Город = [Введите город]; " & vbCrLf
    MakeQuery db, "22 Повышение цен в городе на процент", s
    s = ""
    s = s & "PARAMETERS [Введите шифр зала] Text, [Введите дату] DateTime, [Введите время] DateTime, [Введите количество проданных билетов] Long; " & vbCrLf
    s = s & "UPDATE [Выступления] " & vbCrLf
    s = s & "SET [ПроданоБилетов] = [ПроданоБилетов]+[Введите количество проданных билетов] " & vbCrLf
    s = s & "WHERE ШифрЗала = [Введите шифр зала] AND Дата = [Введите дату] AND Время = [Введите время]; " & vbCrLf
    MakeQuery db, "23 Продажа билетов на выступление", s
    s = ""
    s = s & "PARAMETERS [Введите шифр труппы] Text, [Введите название театра] Text, [Введите город] Text, [Введите количество человек] Long, [Введите количество спектаклей] Long; " & vbCrLf
    s = s & "INSERT INTO [ТеатральныеТруппы] ([ШифрТруппы], [НазваниеТеатра], [Город], [КоличествоЧеловек], [КоличествоСпектаклей]) " & vbCrLf
    s = s & "SELECT [Введите шифр труппы] AS [Ш], [Введите название театра] AS [Н], [Введите город] AS [Г], [Введите количество человек] AS [Ч], [Введите количество спектаклей] AS [С]; " & vbCrLf
    MakeQuery db, "24 Добавление труппы", s
    s = ""
    s = s & "PARAMETERS [Введите шифр труппы] Text, [Введите шифр зала] Text, [Введите название спектакля] Text, [Введите дату] DateTime, [Введите время] DateTime; " & vbCrLf
    s = s & "INSERT INTO [Выступления] ([ШифрТруппы], [ШифрЗала], [НазваниеСпектакля], [Дата], [Время], [ПроданоБилетов]) " & vbCrLf
    s = s & "SELECT [Введите шифр труппы] AS [Т], [Введите шифр зала] AS [З], [Введите название спектакля] AS [С], [Введите дату] AS [Д], [Введите время] AS [В], 0 AS [П]; " & vbCrLf
    MakeQuery db, "25 Добавление выступления", s
    s = ""
    s = s & "PARAMETERS [Введите шифр зала] Text, [Введите дату] DateTime, [Введите время] DateTime; " & vbCrLf
    s = s & "DELETE * " & vbCrLf
    s = s & "FROM [Выступления] " & vbCrLf
    s = s & "WHERE ШифрЗала = [Введите шифр зала] AND Дата = [Введите дату] AND Время = [Введите время]; " & vbCrLf
    MakeQuery db, "26 Удаление выступления", s
    s = ""
    s = s & "PARAMETERS [Введите дату] DateTime; " & vbCrLf
    s = s & "DELETE * " & vbCrLf
    s = s & "FROM [Выступления] " & vbCrLf
    s = s & "WHERE Дата < [Введите дату]; " & vbCrLf
    MakeQuery db, "27 Удаление выступлений до даты", s
    s = ""
    s = s & "SELECT В.ШифрТруппы, В.Дата, В.Время, В.НазваниеСпектакля, З.Город, З.Адрес, В.ПроданоБилетов " & vbCrLf
    s = s & "FROM [Выступления] AS [В] INNER JOIN [КонцертныеЗалы] AS [З] ON В.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "ORDER BY В.Дата, В.Время; " & vbCrLf
    MakeQuery db, "Форма_Выступления труппы", s
    s = ""
    s = s & "SELECT В.ШифрЗала, В.Дата, В.Время, Т.НазваниеТеатра, В.НазваниеСпектакля, В.ПроданоБилетов " & vbCrLf
    s = s & "FROM [Выступления] AS [В] INNER JOIN [ТеатральныеТруппы] AS [Т] ON В.ШифрТруппы = Т.ШифрТруппы " & vbCrLf
    s = s & "ORDER BY В.Дата, В.Время; " & vbCrLf
    MakeQuery db, "Форма_Афиша зала", s
    s = ""
    s = s & "SELECT К.ШифрЗала, К.КатегорияМест, К.РядС, К.РядПо, К.Коэффициент, CCur([З].[СтоимостьБилета]*[К].[Коэффициент]) AS [Стоимость билета] " & vbCrLf
    s = s & "FROM [КатегорииМест] AS [К] INNER JOIN [КонцертныеЗалы] AS [З] ON К.ШифрЗала = З.ШифрЗала " & vbCrLf
    s = s & "ORDER BY К.Коэффициент DESC; " & vbCrLf
    MakeQuery db, "Форма_Цены по категориям", s
    db.QueryDefs.Refresh
    MsgBox "Запросы пересозданы.", vbInformation, "Гастроли"
End Sub

Private Sub MakeQuery(db As DAO.Database, ByVal nm As String, ByVal sql As String)
    On Error Resume Next
    db.QueryDefs.Delete nm
    On Error GoTo 0
    db.CreateQueryDef nm, sql
End Sub
