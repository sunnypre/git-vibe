using GitVibe.Core.Models;
using GitVibe.Styles;
using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Staging;

public class StagingView(List<StagingViewItem> items, int selectedIndex = -1, int scrollOffset = 0, int pageSize = 10) : Renderable
{
    public static int GetSelectedRowIndex(List<StagingViewItem> items, int selectedIndex)
    {
        if (selectedIndex == -1 || items.Count == 0) return 0;
        return selectedIndex;
    }

    public static int GetTotalRows(List<StagingViewItem> items)
    {
        return items.Count == 0 ? 1 : items.Count;
    }

    protected override IEnumerable<Segment> Render(RenderOptions options, int maxWidth)
    {
        var table = new Table()
            .Expand()
            .Border(TableBorder.None)
            .HideHeaders();

        table.AddColumn("Pointer", c => c.Width(1).NoWrap());
        table.AddColumn("Status", c => c.Width(10).NoWrap());
        table.AddColumn("File");

        var allRows = new List<Action<Table>>();

        if (items.Count == 0)
        {
            allRows.Add(t => t.AddRow(Text.Empty, new Markup("[grey]No changes detected. Repository is clean.[/]"), Text.Empty));
        }
        else
        {
            for (int i = 0; i < items.Count; i++)
            {
                var item = items[i];
                var localIndex = i;
                allRows.Add(t => AddFileRow(t, item, localIndex == selectedIndex));
            }
        }

        var rowsToRender = allRows.Skip(scrollOffset).Take(pageSize).ToList();
        foreach (var rowAction in rowsToRender)
        {
            rowAction(table);
        }

        return ((IRenderable)table).Render(options, maxWidth);
    }

    private static void AddFileRow(Table table, StagingViewItem item, bool isSelected)
    {
        var pointer = isSelected ? (IRenderable)new Markup("[bold blue]>[/]") : Text.Empty;
        var style = isSelected ? "on blue" : "";
        
        var checkbox = item.IsStagedSection ? "[[x]]" : "[[ ]]";
        var statusColor = item.IsStagedSection ? VibeTheme.Staged : VibeTheme.Dimmed;

        // Requirement: remove selection background from the checkbox column
        var statusMarkup = $"[{statusColor}]{checkbox}[/]";

        table.AddRow(
            pointer,
            new Markup(statusMarkup),
            GetFileMarkup(item.File, item.IsStagedSection, style)
        );
    }

    private static Markup GetFileMarkup(GitFile file, bool isStagedSection, string style = "")
    {
        // When unified, we show the overall state. If partially staged, we show as [x] in the checkbox,
        // but the file label should probably reflect its status.
        // The artifact says: "If a file is partially staged, f.IsStaged is true, and it shows as [x]. 
        // Toggling it will unstage everything for that file."
        
        var status = isStagedSection ? file.StagedStatus : file.UnstagedStatus;
        
        // In unified view, if we are staged, we might want to show staged status.
        // If we have both, we show staged.
        if (file.IsPartiallyStaged && isStagedSection)
        {
             status = file.StagedStatus;
        }

        var color = status switch
        {
            GitStatus.Added => VibeTheme.Added,
            GitStatus.Modified => VibeTheme.Modified,
            GitStatus.Deleted => VibeTheme.Deleted,
            GitStatus.Untracked => VibeTheme.Untracked,
            _ => VibeTheme.Dimmed
        };

        var icon = status switch
        {
            GitStatus.Added => VibeTheme.AddedIcon,
            GitStatus.Modified => VibeTheme.ModifiedIcon,
            GitStatus.Deleted => VibeTheme.DeletedIcon,
            GitStatus.Untracked => VibeTheme.UntrackedIcon,
            _ => " "
        };

        var path = file.OriginalPath != null 
            ? $"{Markup.Escape(file.OriginalPath)} -> {Markup.Escape(file.Path)}" 
            : Markup.Escape(file.Path);
            
        var fullStyle = string.IsNullOrEmpty(style) ? color : $"{color} {style}";
        return new Markup($"[{fullStyle}]{icon} {path}[/]");
    }
}
